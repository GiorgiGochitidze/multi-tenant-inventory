import {
  RevenueMetricsDto,
  TopSellingProductDto,
} from '../dto/analytics-response.dto';

// Note: the service reads raw query builder rows where numeric values come back
// as strings (Postgres SUM/AVG/COUNT return strings via node-postgres), then
// the service does Number(...) conversion itself. These factories represent
// the ALREADY-CONVERTED shape the service returns to its caller.

export const buildRevenueMetrics = (
  overrides?: Partial<RevenueMetricsDto>,
): RevenueMetricsDto => ({
  totalSales: 15450.75,
  totalOrders: 320,
  averageOrderValue: 48.28,
  ...overrides,
});

export const buildTopSellingProduct = (
  overrides?: Partial<TopSellingProductDto>,
): TopSellingProductDto => ({
  productId: 'e3a1f890-5c6b-4a7b-8d9e-1f2a3b4c5d6e',
  productName: 'Wireless Gaming Mouse',
  totalSold: 120,
  totalGeneratedRevenue: 7198.8,
  ...overrides,
});

// Raw factories: represent what TypeORM's getRawOne()/getRawMany() actually
// return BEFORE the service converts strings to numbers. Useful for testing
// that the Number(...) conversion logic itself works correctly.

export const buildRawRevenueResult = (overrides?: {
  totalSales?: string | null;
  totalOrders?: string | null;
  averageOrderValue?: string | null;
}) => ({
  totalSales: '15450.75',
  totalOrders: '320',
  averageOrderValue: '48.28',
  ...overrides,
});

export const buildRawTopProductResult = (overrides?: {
  productId?: string;
  productName?: string;
  totalSold?: string;
  totalGeneratedRevenue?: string;
}) => ({
  productId: 'e3a1f890-5c6b-4a7b-8d9e-1f2a3b4c5d6e',
  productName: 'Wireless Gaming Mouse',
  totalSold: '120',
  totalGeneratedRevenue: '7198.80',
  ...overrides,
});

// A reusable mock query builder factory: every chainable method returns
// itself (mockReturnThis), matching TypeORM's real fluent-chaining API.
// Only getRawOne/getRawMany need per-test configuration.
export const createMockQueryBuilder = () => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  getRawOne: jest.fn(),
  getRawMany: jest.fn(),
});
