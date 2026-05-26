import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DiningSession } from '../dining_sessions/dining_sessions.entity';
import { OrderEvent } from '../order_events/order_events.entity';
import { Order } from '../orders/orders.entity';
import { UserRole } from '../roles/user_venue_roles.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: true, name: 'password_hash' })
  passwordHash!: string | null;

  @Column({ type: 'varchar', length: 150, name: 'full_name' })
  fullName!: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  roles!: UserRole[];

  @OneToMany(() => DiningSession, (diningSession) => diningSession.openedByUser)
  openedDiningSessions!: DiningSession[];

  @OneToMany(() => Order, (order) => order.createdByUser)
  createdOrders!: Order[];

  @OneToMany(() => OrderEvent, (orderEvent) => orderEvent.changedByUser)
  orderEvents!: OrderEvent[];
}
