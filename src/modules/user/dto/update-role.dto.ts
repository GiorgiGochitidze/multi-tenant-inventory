import { IsEnum } from 'class-validator';
import { UserRole } from '../entity/User.entity';

export class UpdateRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
