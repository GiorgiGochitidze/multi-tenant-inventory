import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../user/entity/User.entity';

export const ROLE_KEYS = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLE_KEYS, roles);
