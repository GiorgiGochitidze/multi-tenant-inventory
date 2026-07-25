import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../tenant/entity/Tenant.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

@Entity('users')
export class User {
  /**
   * Unique user ID (UUID v4)
   * @example "4e617fbd-7a96-4cc7-b60f-15eddfa33dc0"
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * User Name
   * @example "John Doe"
   */
  @Column({ type: 'varchar' })
  name!: string;

  /**
   * Unique email address
   * @example "john.doe@example.com"
   */
  @Column({ unique: true, type: 'varchar' })
  email!: string;

  /**
   * Password hash (excluded from selections)
   */
  @Column({ type: 'varchar' })
  password!: string;

  /**
   * Assigned user role
   * @example "STAFF"
   */
  @Column({ type: 'enum', enum: UserRole, default: UserRole.STAFF })
  role!: UserRole;

  /**
   * Whether the account is active
   * @example true
   */
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', nullable: true, default: null })
  refreshToken!: string | null;

  /**
   * ID of the belonging tenant
   * @example "7103268b-9791-46d1-9029-c9481d4a402a"
   */
  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  /**
   * User creation date
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
