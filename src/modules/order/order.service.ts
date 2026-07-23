import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { Order, OrderStatus } from './entity/Order.entity';
import { OrderItem } from './entity/OrderItem.entity';
import { Product } from '../product/entity/Product.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  private validId(...ids: string[]) {
    for (const id of ids) {
      if (!id || !isUUID(id)) {
        throw new NotFoundException(
          'Order, Product, or Tenant with given ID not found',
        );
      }
    }
  }

  async createOrder(tenantId: string, dto: CreateOrderDto) {
    this.validId(tenantId);

    const productIds = dto.items.map((item) => item.productId);

    return await this.dataSource.transaction(async (manager) => {
      // 1. Fetch products scoped to tenant
      const products = await manager.find(Product, {
        where: { id: In(productIds), tenantId },
      });

      if (products.length !== productIds.length) {
        throw new NotFoundException(
          'One or more requested products were not found for this tenant',
        );
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      let totalAmount = 0;
      const orderItemsToCreate: OrderItem[] = [];

      // 2. Validate stock, deduct inventory, and snapshot price
      for (const itemDto of dto.items) {
        const product = productMap.get(itemDto.productId);

        if (!product) {
          throw new NotFoundException(`Product ${itemDto.productId} not found`);
        }

        if (product.stockQuantity < itemDto.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product "${product.name}". Available: ${product.stockQuantity}, Requested: ${itemDto.quantity}`,
          );
        }

        // Deduct inventory stock
        product.stockQuantity -= itemDto.quantity;

        // Calculate total price
        const itemTotal = Number(product.price) * itemDto.quantity;
        totalAmount += itemTotal;

        const orderItem = manager.create(OrderItem, {
          productId: product.id,
          quantity: itemDto.quantity,
          unitPrice: product.price,
        });

        orderItemsToCreate.push(orderItem);
      }

      // Batch update updated product inventory
      await manager.save(Product, products);

      // Create and save main Order entity
      const newOrder = manager.create(Order, {
        tenantId,
        totalAmount,
        status: OrderStatus.PENDING,
        items: orderItemsToCreate,
      });

      return await manager.save(Order, newOrder);
    });
  }

  async getOrders(page: string, pageSize: string, tenantId: string) {
    this.validId(tenantId);

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(pageSize) || 10);

    const orders = await this.orderRepository.find({
      where: { tenantId },
      relations: { items: true },
      order: { createdAt: 'DESC' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    if (orders.length === 0) {
      throw new NotFoundException('No orders found for this tenant');
    }

    return orders;
  }

  async getOrderById(orderId: string, tenantId: string) {
    this.validId(orderId, tenantId);

    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenantId },
      relations: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order with this ID or TenantID not found');
    }

    return order;
  }
}
