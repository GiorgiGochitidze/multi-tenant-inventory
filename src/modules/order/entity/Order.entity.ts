import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../tenant/entity/Tenant.entity';
import { OrderItem } from './OrderItem.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Index(['tenantId', 'orderNumber'], { unique: true })
@Entity('orders')
export class Order {
  /**
   * Order UUID
   * @example "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Human-readable order number
   * @example "ORD-2026-00102"
   */
  @Column({ type: 'varchar' })
  orderNumber!: string;

  /**
   * Order status
   * @example "PENDING"
   */
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  /**
   * Total calculated order amount
   * @example 99.98
   */
  @Column('decimal', { precision: 10, scale: 2, default: 0.0 })
  totalAmount!: number;

  /**
   * Belonging tenant UUID
   * @example "7103268b-9791-46d1-9029-c9481d4a402a"
   */
  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];

  /**
   * Creation date
   * @example "2026-07-25T12:00:00.000Z"
   */
  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  /**
   * Last update date
   * @example "2026-07-25T12:00:00.000Z"
   */
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
