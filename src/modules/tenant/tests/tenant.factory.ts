import { Tenant } from '../entity/Tenant.entity';

export const buildTenant = (overrides?: Partial<Tenant>): Tenant => ({
  id: '5f2c1a3e-4d9b-4c7a-8e1f-6a2b3c4d5e6f',
  name: 'Default Test Tenant',
  slug: 'default-test-tenant-shop',
  users: [],
  products: [],
  orders: [],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});
