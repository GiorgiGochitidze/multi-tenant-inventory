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
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', unique: true })
  slug!: string;

  @OneToMany(() => User, (user) => user.tenant)
  users!: User[];

  @OneToMany(() => Product, (product) => product.tenant)
  products!: Product[];

  @OneToMany(() => Order, (order) => order.tenant)
  orders!: Order[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
