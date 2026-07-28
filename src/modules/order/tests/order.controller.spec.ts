import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from '../order.controller';
import { OrderService } from '../order.service';
import { OrderStatus } from '../entity/Order.entity';
import { OrderResponseDto } from '../dto/order-response.dto';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';

describe('OrderController', () => {
  let controller: OrderController;
  let mockOrderService: Partial<Record<keyof OrderService, jest.Mock>>;

  const mockTenantId = '7103268b-9791-46d1-9029-c9481d4a402a';
  const mockOrderId = '3c9a1e2b-4d5f-4a6b-8c7d-9e0f1a2b3c4d';

  const mockOrderResponse = {
    id: mockOrderId,
    tenantId: mockTenantId,
    status: OrderStatus.PENDING,
    totalAmount: 50,
    items: [],
  } as unknown as OrderResponseDto;

  beforeEach(async () => {
    mockOrderService = {
      createOrder: jest.fn(),
      getOrders: jest.fn(),
      getOrderById: jest.fn(),
      cancelOrder: jest.fn(),
      confirmOrder: jest.fn(),
      updateOrderStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [{ provide: OrderService, useValue: mockOrderService }],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should call orderService.createOrder with tenantId and the dto', async () => {
      const dto: CreateOrderDto = {
        items: [{ productId: 'some-product-id', quantity: 2 }],
      };
      mockOrderService.createOrder?.mockResolvedValue(mockOrderResponse);

      const result = await controller.createOrder(mockTenantId, dto);

      expect(mockOrderService.createOrder).toHaveBeenCalledWith(
        mockTenantId,
        dto,
      );
      expect(result).toEqual(mockOrderResponse);
    });
  });

  describe('getOrders', () => {
    it('should call orderService.getOrders with page, pageSize, and tenantId', async () => {
      const orders = [mockOrderResponse];
      mockOrderService.getOrders?.mockResolvedValue(orders);

      const result = await controller.getOrders('1', '5', mockTenantId);

      expect(mockOrderService.getOrders).toHaveBeenCalledWith(
        '1',
        '5',
        mockTenantId,
      );
      expect(result).toEqual(orders);
    });
  });

  describe('getOrderById', () => {
    it('should call orderService.getOrderById with id and tenantId', async () => {
      mockOrderService.getOrderById?.mockResolvedValue(mockOrderResponse);

      const result = await controller.getOrderById(mockOrderId, mockTenantId);

      expect(mockOrderService.getOrderById).toHaveBeenCalledWith(
        mockOrderId,
        mockTenantId,
      );
      expect(result).toEqual(mockOrderResponse);
    });
  });

  describe('cancelOrder', () => {
    it('should call orderService.cancelOrder with id and tenantId', async () => {
      const cancelledOrder = {
        ...mockOrderResponse,
        status: OrderStatus.CANCELLED,
      };
      mockOrderService.cancelOrder?.mockResolvedValue(cancelledOrder);

      const result = await controller.cancelOrder(mockOrderId, mockTenantId);

      expect(mockOrderService.cancelOrder).toHaveBeenCalledWith(
        mockOrderId,
        mockTenantId,
      );
      expect(result).toEqual(cancelledOrder);
    });
  });

  describe('confirmOrder', () => {
    it('should call orderService.confirmOrder with orderId and tenantId', async () => {
      const confirmedOrder = {
        ...mockOrderResponse,
        status: OrderStatus.CONFIRMED,
      };
      mockOrderService.confirmOrder?.mockResolvedValue(confirmedOrder);

      const result = await controller.confirmOrder(mockOrderId, mockTenantId);

      expect(mockOrderService.confirmOrder).toHaveBeenCalledWith(
        mockOrderId,
        mockTenantId,
      );
      expect(result).toEqual(confirmedOrder);
    });
  });

  describe('updateOrderStatus', () => {
    it('should call orderService.updateOrderStatus with orderId, tenantId, and dto', async () => {
      const dto: UpdateOrderStatusDto = { status: OrderStatus.COMPLETED };
      const updatedOrder = {
        ...mockOrderResponse,
        status: OrderStatus.COMPLETED,
      };
      mockOrderService.updateOrderStatus?.mockResolvedValue(updatedOrder);

      const result = await controller.updateOrderStatus(
        mockOrderId,
        mockTenantId,
        dto,
      );

      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(
        mockOrderId,
        mockTenantId,
        dto,
      );
      expect(result).toEqual(updatedOrder);
    });
  });
});
