import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderService } from '../order.service';
import { Order, OrderStatus } from '../entity/Order.entity';
import {
  createMockRepository,
  MockRepository,
} from '../../../../test/mock-repository';
import { buildProduct } from '../../product/tests/product.factory';
import {
  buildOrder,
  buildOrderItem,
  createMockTransactionManager,
  createMockDataSource,
} from './order.factory';

describe('OrderService', () => {
  let service: OrderService;
  let mockOrderRepository: MockRepository<Order>;
  let mockManager: ReturnType<typeof createMockTransactionManager>;
  let mockDataSource: ReturnType<typeof createMockDataSource>;

  const mockTenantId = '7103268b-9791-46d1-9029-c9481d4a402a';

  beforeEach(async () => {
    mockOrderRepository = createMockRepository<Order>();
    mockManager = createMockTransactionManager();
    mockDataSource = createMockDataSource(mockManager);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const createDto = {
      items: [
        { productId: '7a69aa1c-d816-4a26-b51a-c0b795432b5b', quantity: 2 },
      ],
    };

    it('should create an order, deduct stock, and return the saved order', async () => {
      const product = buildProduct({
        id: '7a69aa1c-d816-4a26-b51a-c0b795432b5b',
        stockQuantity: 10,
        price: 25,
      });
      const orderItem = buildOrderItem({ productId: product.id, quantity: 2 });
      const savedOrder = buildOrder({ items: [orderItem], totalAmount: 50 });

      // call order inside createOrder's transaction:
      // find(Product) -> create(OrderItem) -> save(Product) -> create(Order) -> save(Order)
      mockManager.find.mockResolvedValueOnce([product]);
      mockManager.create
        .mockReturnValueOnce(orderItem) // create(OrderItem, ...)
        .mockReturnValueOnce(savedOrder); // create(Order, ...)
      mockManager.save
        .mockResolvedValueOnce([product]) // save(Product, products)
        .mockResolvedValueOnce(savedOrder); // save(Order, newOrder)

      const result = await service.createOrder(mockTenantId, createDto);

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(product.stockQuantity).toBe(8); // 10 - 2, mutated in place
      expect(result).toEqual(savedOrder);
    });

    it('should throw NotFoundException if any requested product does not exist for the tenant', async () => {
      // dto asks for 1 product, but none are returned -> length mismatch
      mockManager.find.mockResolvedValueOnce([]);

      await expect(
        service.createOrder(mockTenantId, createDto),
      ).rejects.toThrow(NotFoundException);

      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if requested quantity exceeds stock', async () => {
      const product = buildProduct({
        id: '7a69aa1c-d816-4a26-b51a-c0b795432b5b',
        stockQuantity: 1, // less than requested quantity of 2
      });
      mockManager.find.mockResolvedValueOnce([product]);

      await expect(
        service.createOrder(mockTenantId, createDto),
      ).rejects.toThrow(BadRequestException);

      expect(mockManager.save).not.toHaveBeenCalled();
    });
  });

  describe('getOrders', () => {
    it('should return paginated orders for the tenant', async () => {
      const orders = [buildOrder()];
      mockOrderRepository.find?.mockResolvedValue(orders);

      const result = await service.getOrders('1', '5', mockTenantId);

      expect(mockOrderRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: mockTenantId },
          skip: 0,
          take: 5,
        }),
      );
      expect(result).toEqual(orders);
    });

    it('should throw NotFoundException if no orders are found', async () => {
      mockOrderRepository.find?.mockResolvedValue([]);

      await expect(service.getOrders('1', '5', mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getOrderById', () => {
    it('should return the order when found', async () => {
      const order = buildOrder();
      mockOrderRepository.findOne?.mockResolvedValue(order);

      const result = await service.getOrderById(order.id, mockTenantId);

      expect(mockOrderRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: order.id, tenantId: mockTenantId },
        }),
      );
      expect(result).toEqual(order);
    });

    it('should throw NotFoundException when no order is found', async () => {
      mockOrderRepository.findOne?.mockResolvedValue(null);

      await expect(
        service.getOrderById('some-id', mockTenantId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelOrder', () => {
    it('should restore stock for each item and mark the order cancelled', async () => {
      const orderItem = buildOrderItem({
        productId: '7a69aa1c-d816-4a26-b51a-c0b795432b5b',
        quantity: 3,
      });
      const order = buildOrder({
        status: OrderStatus.PENDING,
        items: [orderItem],
      });
      const product = buildProduct({
        id: '7a69aa1c-d816-4a26-b51a-c0b795432b5b',
        stockQuantity: 5,
      });
      const cancelledOrder = { ...order, status: OrderStatus.CANCELLED };

      mockManager.findOne.mockResolvedValueOnce(order);
      mockManager.find.mockResolvedValueOnce([product]); // fetch products (withDeleted: true)
      mockManager.save
        .mockResolvedValueOnce([product]) // save(Product, products)
        .mockResolvedValueOnce(cancelledOrder); // save(Order, order)

      const result = await service.cancelOrder(order.id, mockTenantId);

      expect(product.stockQuantity).toBe(8); // 5 + 3 restored
      expect(result).toEqual(cancelledOrder);
    });

    it('should throw NotFoundException if the order does not exist', async () => {
      mockManager.findOne.mockResolvedValueOnce(null);

      await expect(
        service.cancelOrder('some-id', mockTenantId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if the order is already cancelled', async () => {
      const order = buildOrder({ status: OrderStatus.CANCELLED });
      mockManager.findOne.mockResolvedValueOnce(order);

      await expect(service.cancelOrder(order.id, mockTenantId)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockManager.save).not.toHaveBeenCalled();
    });
  });

  describe('updateOrderStatus', () => {
    it('should update the status directly for a non-cancel transition', async () => {
      const order = buildOrder({ status: OrderStatus.PENDING });
      const updatedOrder = { ...order, status: OrderStatus.CONFIRMED };

      mockOrderRepository.findOne?.mockResolvedValue(order);
      mockOrderRepository.save?.mockResolvedValue(updatedOrder);

      const result = await service.updateOrderStatus(order.id, mockTenantId, {
        status: OrderStatus.CONFIRMED,
      });

      expect(mockOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatus.CONFIRMED }),
      );
      expect(result).toEqual(updatedOrder);
    });

    it('should delegate to the real cancelOrder logic when status is CANCELLED', async () => {
      const orderItem = buildOrderItem({
        productId: '7a69aa1c-d816-4a26-b51a-c0b795432b5b',
        quantity: 1,
      });
      const order = buildOrder({
        status: OrderStatus.PENDING,
        items: [orderItem],
      });
      const product = buildProduct({
        id: '7a69aa1c-d816-4a26-b51a-c0b795432b5b',
        stockQuantity: 4,
      });
      const cancelledOrder = { ...order, status: OrderStatus.CANCELLED };

      // updateOrderStatus's own findOne (via orderRepository, not manager)
      mockOrderRepository.findOne?.mockResolvedValue(order);

      // then cancelOrder's internal transaction calls (via manager)
      mockManager.findOne.mockResolvedValueOnce(order);
      mockManager.find.mockResolvedValueOnce([product]);
      mockManager.save
        .mockResolvedValueOnce([product])
        .mockResolvedValueOnce(cancelledOrder);

      const result = await service.updateOrderStatus(order.id, mockTenantId, {
        status: OrderStatus.CANCELLED,
      });

      expect(product.stockQuantity).toBe(5); // stock restored via real cancelOrder logic
      expect(result).toEqual(cancelledOrder);
    });

    it('should throw NotFoundException if the order does not exist', async () => {
      mockOrderRepository.findOne?.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus('some-id', mockTenantId, {
          status: OrderStatus.CONFIRMED,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if the order is already cancelled', async () => {
      const order = buildOrder({ status: OrderStatus.CANCELLED });
      mockOrderRepository.findOne?.mockResolvedValue(order);

      await expect(
        service.updateOrderStatus(order.id, mockTenantId, {
          status: OrderStatus.CONFIRMED,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockOrderRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('confirmOrder', () => {
    it('should call updateOrderStatus with CONFIRMED status', async () => {
      const order = buildOrder({ status: OrderStatus.PENDING });
      const confirmedOrder = { ...order, status: OrderStatus.CONFIRMED };

      mockOrderRepository.findOne?.mockResolvedValue(order);
      mockOrderRepository.save?.mockResolvedValue(confirmedOrder);

      const result = await service.confirmOrder(order.id, mockTenantId);

      expect(mockOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatus.CONFIRMED }),
      );
      expect(result).toEqual(confirmedOrder);
    });
  });
});
