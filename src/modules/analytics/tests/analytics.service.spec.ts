import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AnalyticsService } from '../analytics.service';
import { Product } from '../../product/entity/Product.entity';
import { Order } from '../../order/entity/Order.entity';
import { OrderItem } from '../../order/entity/OrderItem.entity';
import {
  createMockRepository,
  MockRepository,
} from '../../../../test/mock-repository';
import {
  createMockQueryBuilder,
  buildRawRevenueResult,
  buildRawTopProductResult,
} from './analytics.factory';
import { buildProduct } from '../../product/tests/product.factory';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockProductRepository: MockRepository<Product>;
  let mockOrderRepository: MockRepository<Order>;
  let mockOrderItemRepository: MockRepository<OrderItem>;

  const mockTenantId = '7103268b-9791-46d1-9029-c9481d4a402a';

  beforeEach(async () => {
    mockProductRepository = createMockRepository<Product>();
    mockOrderRepository = createMockRepository<Order>();
    mockOrderItemRepository = createMockRepository<OrderItem>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLowStockProduct', () => {
    it('should return low stock products with correct pagination args', async () => {
      const products = [buildProduct({ stockQuantity: 2 })];
      mockProductRepository.find?.mockResolvedValue(products);

      const result = await service.getLowStockProduct(
        mockTenantId,
        10,
        '1',
        '5',
      );

      expect(mockProductRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: mockTenantId }),
          order: { stockQuantity: 'ASC' },
          skip: 0,
          take: 5,
          withDeleted: false,
        }),
      );
      expect(result).toEqual(products);
    });

    it('should throw NotFoundException when no low stock products are found', async () => {
      mockProductRepository.find?.mockResolvedValue([]);

      await expect(
        service.getLowStockProduct(mockTenantId, 10, '1', '5'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('revenueMetrics', () => {
    it('should return converted numeric revenue metrics', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawOne.mockResolvedValue(buildRawRevenueResult());

      mockOrderRepository.createQueryBuilder?.mockReturnValue(mockQueryBuilder);

      const result = await service.revenueMetrics(mockTenantId);

      expect(mockOrderRepository.createQueryBuilder).toHaveBeenCalledWith(
        'order',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'order.tenantId = :tenantId',
        { tenantId: mockTenantId },
      );
      expect(result).toEqual({
        totalSales: 15450.75,
        totalOrders: 320,
        averageOrderValue: 48.28,
      });
    });

    it('should default all fields to 0 when the query returns no rows', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawOne.mockResolvedValue(undefined);

      mockOrderRepository.createQueryBuilder?.mockReturnValue(mockQueryBuilder);

      const result = await service.revenueMetrics(mockTenantId);

      expect(result).toEqual({
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
      });
    });
  });

  describe('topSellingProducts', () => {
    it('should return converted numeric top-selling product rows', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([
        buildRawTopProductResult(),
      ]);

      mockOrderItemRepository.createQueryBuilder?.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.topSellingProducts(mockTenantId, '5');

      expect(mockOrderItemRepository.createQueryBuilder).toHaveBeenCalledWith(
        'item',
      );
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5);
      expect(result).toEqual([
        {
          productId: 'e3a1f890-5c6b-4a7b-8d9e-1f2a3b4c5d6e',
          productName: 'Wireless Gaming Mouse',
          totalSold: 120,
          totalGeneratedRevenue: 7198.8,
        },
      ]);
    });

    it('should return an empty array when no rows are found', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      mockOrderItemRepository.createQueryBuilder?.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.topSellingProducts(mockTenantId, '5');

      expect(result).toEqual([]);
    });

    it('should fall back to a limit of 10 when limit is invalid', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      mockOrderItemRepository.createQueryBuilder?.mockReturnValue(
        mockQueryBuilder,
      );

      await service.topSellingProducts(mockTenantId, 'not-a-number');

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });
  });
});
