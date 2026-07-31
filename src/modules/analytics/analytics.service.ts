import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../product/entity/Product.entity';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Order, OrderStatus } from '../order/entity/Order.entity';
import { OrderItem } from '../order/entity/OrderItem.entity';
import { validateUUIDs } from '../../utils/idsValidation.util';

interface RevenueRawResult {
  totalSales: string | null;
  totalOrders: string | null;
  averageOrderValue: string | null;
}

interface TopProductRawResult {
  productId: string;
  productName: string;
  totalSold: string;
  totalGeneratedRevenue: string;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async getLowStockProduct(
    tenantId: string,
    lowStockThreshold: number,
    page: string,
    limit: string,
  ) {
    validateUUIDs(tenantId);

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);

    const products = await this.productRepository.find({
      where: { tenantId, stockQuantity: LessThanOrEqual(lowStockThreshold) },
      order: { stockQuantity: 'ASC' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      withDeleted: false,
    });

    return products;
  }

  async revenueMetrics(tenantId: string) {
    validateUUIDs(tenantId);

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
      averageOrderValue: Number(rawResult?.averageOrderValue) || 0,
    };
  }

  async topSellingProducts(tenantId: string, limit: string) {
    validateUUIDs(tenantId);

    const limitNum = Math.max(1, Number(limit) || 10);

    const rawResult = await this.orderItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .innerJoin('item.product', 'product')
      .select('item.productId', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('SUM(item.quantity)', 'totalSold')
      .addSelect('SUM(item.quantity * item.unitPrice)', 'totalGeneratedRevenue')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.status != :status', { status: OrderStatus.CANCELLED })
      .groupBy('item.productId')
      .addGroupBy('product.name')
      .orderBy('"totalSold"', 'DESC')
      .limit(limitNum)
      .getRawMany<TopProductRawResult>();

    return rawResult.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      totalSold: Number(row.totalSold) || 0,
      totalGeneratedRevenue: Number(row.totalGeneratedRevenue) || 0,
    }));
  }
}
