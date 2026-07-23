import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID('4', { message: 'productId must be a valid UUID' })
  productId!: string;

  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity!: number;
}
