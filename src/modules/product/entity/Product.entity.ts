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
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  sku!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'int', default: 0 })
  stockQuantity!: number;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt!: Date;
}
