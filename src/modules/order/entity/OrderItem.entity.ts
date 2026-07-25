import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './Order.entity';
import { Product } from '../../product/entity/Product.entity';

@Entity('order_items')
export class OrderItem {
  /**
   * Item UUID
   * @example "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Associated order UUID
   * @example "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
   */
  @Column({ type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  /**
   * Purchased product UUID
   * @example "e3a1f890-5c6b-4a7b-8d9e-1f2a3b4c5d6e"
   */
  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  /**
   * Item quantity
   * @example 2
   */
  @Column({ type: 'int' })
  quantity!: number;

  /**
   * Price per unit at purchase time
   * @example 49.99
   */
  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice!: number;

  /**
   * Creation date
   * @example "2026-07-25T12:00:00.000Z"
   */
  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
