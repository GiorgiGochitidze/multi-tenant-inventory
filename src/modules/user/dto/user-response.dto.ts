import { OmitType } from '@nestjs/swagger';
import { User } from '../entity/User.entity';

export class UserResponseDto extends OmitType(User, [
  'password',
  'refreshToken',
] as const) {}
