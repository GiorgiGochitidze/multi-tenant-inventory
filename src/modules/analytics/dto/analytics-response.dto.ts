import { ApiProperty } from '@nestjs/swagger';

export class RevenueMetricsDto {
  /**
   * @example 15450.75
   */
  @ApiProperty()
  totalSales!: number;

  /**
   * @example 320
   */
  @ApiProperty()
  totalOrders!: number;

  /**
   * @example 48.28
   */
  @ApiProperty()
  averageOrderValue!: number;
}

export class TopSellingProductDto {
  /**
   * @example "e3a1f890-5c6b-4a7b-8d9e-1f2a3b4c5d6e"
   */
  @ApiProperty()
  productId!: string;

  /**
   * @example "Wireless Gaming Mouse"
   */
  @ApiProperty()
  productName!: string;

  /**
   * @example 120
   */
  @ApiProperty()
  totalSold!: number;

  /**
   * @example 7198.80
   */
  @ApiProperty()
  totalGeneratedRevenue!: number;
}
