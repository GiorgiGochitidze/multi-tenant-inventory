import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from '../analytics.controller';
import { AnalyticsService } from '../analytics.service';
import { buildProduct } from '../../product/tests/product.factory';
import {
  buildRevenueMetrics,
  buildTopSellingProduct,
} from './analytics.factory';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let mockAnalyticsService: Partial<Record<keyof AnalyticsService, jest.Mock>>;

  const mockTenantId = '7103268b-9791-46d1-9029-c9481d4a402a';

  beforeEach(async () => {
    mockAnalyticsService = {
      revenueMetrics: jest.fn(),
      topSellingProducts: jest.fn(),
      getLowStockProduct: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRevenueMetrics', () => {
    it('should call analyticsService.revenueMetrics with the resolved tenantId', async () => {
      const metrics = buildRevenueMetrics();
      mockAnalyticsService.revenueMetrics?.mockResolvedValue(metrics);

      const result = await controller.getRevenueMetrics(mockTenantId);

      expect(mockAnalyticsService.revenueMetrics).toHaveBeenCalledWith(
        mockTenantId,
      );
      expect(result).toEqual(metrics);
    });
  });

  describe('getTopSellingProducts', () => {
    it('should call analyticsService.topSellingProducts with tenantId and limit', async () => {
      const products = [buildTopSellingProduct()];
      mockAnalyticsService.topSellingProducts?.mockResolvedValue(products);

      const result = await controller.getTopSellingProducts(mockTenantId, '5');

      expect(mockAnalyticsService.topSellingProducts).toHaveBeenCalledWith(
        mockTenantId,
        '5',
      );
      expect(result).toEqual(products);
    });
  });

  describe('getLowStockProducts', () => {
    it('should parse the threshold and call analyticsService.getLowStockProduct', async () => {
      const products = [buildProduct({ stockQuantity: 2 })];
      mockAnalyticsService.getLowStockProduct?.mockResolvedValue(products);

      const result = await controller.getLowStockProducts(
        mockTenantId,
        '5',
        '1',
        '10',
      );

      expect(mockAnalyticsService.getLowStockProduct).toHaveBeenCalledWith(
        mockTenantId,
        5,
        '1',
        '10',
      );
      expect(result).toEqual(products);
    });

    it('should fall back to a threshold of 10 when threshold is invalid', async () => {
      mockAnalyticsService.getLowStockProduct?.mockResolvedValue([]);

      await controller.getLowStockProducts(
        mockTenantId,
        'not-a-number',
        '1',
        '10',
      );

      expect(mockAnalyticsService.getLowStockProduct).toHaveBeenCalledWith(
        mockTenantId,
        10,
        '1',
        '10',
      );
    });
  });
});
