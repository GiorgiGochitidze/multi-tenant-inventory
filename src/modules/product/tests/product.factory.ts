import { Product } from '../entity/Product.entity';
import { Tenant } from '../../tenant/entity/Tenant.entity';

export const buildProduct = (overrides?: Partial<Product>): Product => ({
  id: '7a69aa1c-d816-4a26-b51a-c0b795432b5b',
  name: 'Default Test Product',
  sku: 'TEST-SKU-001',
  price: 25,
  stockQuantity: 10,
  tenantId: '7103268b-9791-46d1-9029-c9481d4a402a',
  tenant: null as unknown as Tenant,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null as unknown as Date,
  ...overrides,
});
