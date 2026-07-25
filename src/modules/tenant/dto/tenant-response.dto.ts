import { OmitType } from '@nestjs/swagger';
import { Tenant } from '../entity/Tenant.entity';

export class TenantResponseDto extends OmitType(Tenant, [
  'users',
  'products',
  'orders',
] as const) {}
