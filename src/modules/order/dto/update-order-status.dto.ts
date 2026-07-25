import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '../entity/Order.entity';

export class UpdateOrderStatusDto {
  /**
   * Target order status
   * @example "CONFIRMED"
   */
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.CONFIRMED })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status!: OrderStatus;
}
