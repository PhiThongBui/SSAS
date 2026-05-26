import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderItem } from '../order_items/order_items.entity';
import { Order, OrderStatus } from '../orders/orders.entity';
import { User } from '../users/user.entity';

@Entity('order_events')
@Index(['orderId'])
@Index(['orderItemId'])
@Index(['changedAt'])
export class OrderEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'order_id' })
  orderId!: string;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'order_item_id' })
  orderItemId!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'from_status' })
  fromStatus!: OrderStatus | null;

  @Column({ type: 'varchar', length: 20, name: 'to_status' })
  toStatus!: OrderStatus;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'changed_by_user_id' })
  changedByUserId!: string | null;

  @CreateDateColumn({ type: 'datetime', name: 'changed_at' })
  changedAt!: Date;

  @ManyToOne(() => Order, (order) => order.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => OrderItem, (orderItem) => orderItem.events, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'order_item_id' })
  orderItem!: OrderItem | null;

  @ManyToOne(() => User, (user) => user.orderEvents, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changed_by_user_id' })
  changedByUser!: User | null;
}
