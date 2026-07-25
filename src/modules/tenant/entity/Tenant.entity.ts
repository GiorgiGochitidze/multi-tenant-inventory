import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entity/User.entity';
import { Product } from '../../product/entity/Product.entity';
import { Order } from '../../order/entity/Order.entity';

@Entity('tenants')
export class Tenant {
  /**
   * Order UUID
   * @example "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Tenant Name
   * @example "Example-Shop"
   */
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  /**
   * Tenant Slug
   * @example "/example-shop NOTE! auto created, could be changed later"
   */
  @Column({ type: 'varchar', unique: true })
  slug!: string;

  @OneToMany(() => User, (user) => user.tenant)
  users!: User[];

  @OneToMany(() => Product, (product) => product.tenant)
  products!: Product[];

  @OneToMany(() => Order, (order) => order.tenant)
  orders!: Order[];

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
