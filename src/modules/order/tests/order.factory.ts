import { Order, OrderStatus } from '../entity/Order.entity';
import { OrderItem } from '../entity/OrderItem.entity';
import { Product } from '../../product/entity/Product.entity';
import { Tenant } from '../../tenant/entity/Tenant.entity';

export const buildOrderItem = (overrides?: Partial<OrderItem>): OrderItem => ({
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  orderId: '3c9a1e2b-4d5f-4a6b-8c7d-9e0f1a2b3c4d',
  order: null as unknown as Order,
  productId: '7a69aa1c-d816-4a26-b51a-c0b795432b5b',
  product: null as unknown as Product,
  quantity: 2,
  unitPrice: 25,
  createdAt: new Date('2026-01-01'),
  ...overrides,
});

export const buildOrder = (overrides?: Partial<Order>): Order => ({
  id: '3c9a1e2b-4d5f-4a6b-8c7d-9e0f1a2b3c4d',
  orderNumber: 'ORD-2026-00001',
  generateOrderNumber() {},
  status: OrderStatus.PENDING,
  totalAmount: 50,
  tenantId: '7103268b-9791-46d1-9029-c9481d4a402a',
  tenant: null as unknown as Tenant,
  items: [buildOrderItem()],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

export const createMockTransactionManager = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

type MockTransactionManager = ReturnType<typeof createMockTransactionManager>;

export const createMockDataSource = (txManager: MockTransactionManager) => ({
  transaction: jest
    .fn()
    .mockImplementation(
      async (callback: (manager: MockTransactionManager) => Promise<unknown>) =>
        callback(txManager),
    ),
});
