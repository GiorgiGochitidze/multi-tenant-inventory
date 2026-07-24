import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../product/entity/Product.entity';
import { Order } from '../order/entity/Order.entity';
import { OrderItem } from '../order/entity/OrderItem.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Order, OrderItem])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
