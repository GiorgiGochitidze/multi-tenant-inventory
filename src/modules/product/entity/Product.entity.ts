import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../tenant/entity/Tenant.entity';

@Index(['tenantId', 'sku'], { unique: true, where: '"deletedAt" IS NULL' })
@Entity('products')
export class Product {
  /**
   * Product UUID
   * @example "e3a1f890-5c6b-4a7b-8d9e-1f2a3b4c5d6e"
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Product name
   * @example "Wireless Gaming Mouse"
   */
  @Column({ type: 'varchar' })
  name!: string;

  /**
   * Stock keeping unit (SKU)
   * @example "SKU-MOUSE-001"
   */
  @Column({ type: 'varchar' })
  sku!: string;

  /**
   * Unit price
   * @example 59.99
   */
  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  /**
   * Current available stock
   * @example 45
   */
  @Column({ type: 'int', default: 0 })
  stockQuantity!: number;

  /**
   * Associated tenant UUID
   * @example "7103268b-9791-46d1-9029-c9481d4a402a"
   */
  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  /**
   * Creation timestamp
   * @example "2026-07-25T12:00:00.000Z"
   */
  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  /**
   * Last update timestamp
   * @example "2026-07-25T12:00:00.000Z"
   */
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  /**
   * Soft-deletion timestamp
   * @example null
   */
  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt!: Date;
}
