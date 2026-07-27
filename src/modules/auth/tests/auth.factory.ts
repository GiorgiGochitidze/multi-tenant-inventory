import { Tenant } from '../../tenant/entity/Tenant.entity';
import { User, UserRole } from '../../user/entity/User.entity';

export const buildUser = (overrides?: Partial<User>): User => ({
  id: '7a69aa1c-d816-4a26-b51a-c0b795432b5b',
  name: 'test',
  email: 'test@gmail.com',
  password: '$2b$10$ai3Y7ayiOCbIiQqS35T4M.q7EvlJ.4eZW5TfOpI.ONGybGqtD0T4S',
  role: UserRole.STAFF,
  isActive: true,
  refreshToken: null,
  tenantId: '7103268b-9791-46d1-9029-c9481d4a402a',
  tenant: null as unknown as Tenant,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});
