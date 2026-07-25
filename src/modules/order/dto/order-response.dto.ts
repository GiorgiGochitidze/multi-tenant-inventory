import { OmitType } from '@nestjs/swagger';
import { Order } from '../entity/Order.entity';

export class OrderResponseDto extends OmitType(Order, ['tenant'] as const) {}
