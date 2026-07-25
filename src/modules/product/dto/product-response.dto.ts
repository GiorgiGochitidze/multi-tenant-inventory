import { OmitType } from '@nestjs/swagger';
import { Product } from '../entity/Product.entity';

export class ProductResponseDto extends OmitType(Product, [
  'tenant',
] as const) {}
