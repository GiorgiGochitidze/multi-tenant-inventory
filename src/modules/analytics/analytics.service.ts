import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../product/entity/Product.entity';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Order, OrderStatus } from '../order/entity/Order.entity';

interface RevenueRawResult {
  totalSales: string | null;
  totalOrders: string | null;
  avarageOrderValue: string | null;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async getLowStockProduct(
    tenantId: string,
    lowStockTheresold: number,
    page: string,
    limit: string,
  ) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 1);
    const products = await this.productRepository.find({
      where: { tenantId, stockQuantity: LessThanOrEqual(lowStockTheresold) },
      order: { createdAt: 'ASC' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      withDeleted: false,
    });

    if (products.length === 0) {
      throw new NotFoundException('No orders found for this tenant');
    }

    return products;
  }

  async revenueMetrics(tenantId: string) {
    const rawResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalAmount), 0)', 'totalSales')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .addSelect('COALESCE(AVG(order.totalAmount), 0)', 'averageOrderValue')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.status != :cancelledStatus', {
        cancelledStatus: OrderStatus.CANCELLED,
      })
      .getRawOne<RevenueRawResult>();

    return {
      totalSales: Number(rawResult?.totalSales) || 0,
      totalOrders: Number(rawResult?.totalOrders) || 0,
      avarageOrderValue: Number(rawResult?.avarageOrderValue) || 0,
    };
  }

  async topSellingProducts(tenantId: string) {
    
  }
}
