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
import { DiningSessionCombo } from '../dining_session_combos/dining_session_combos.entity';
import { DiningSession } from '../dining_sessions/dining_sessions.entity';
import { OrderEvent } from '../order_events/order_events.entity';
import { OrderItem } from '../order_items/order_items.entity';
import { User } from '../users/user.entity';

export enum OrderType {
  Combo = 'combo',
  PerItem = 'per_item',
}

export enum ComboOrderStatus {
  Requested = 'requested',
  Served = 'served',
  Cancelled = 'cancelled',
}

export enum PerItemOrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Cooking = 'cooking',
  Served = 'served',
  Cancelled = 'cancelled',
}

export type OrderStatus = ComboOrderStatus | PerItemOrderStatus;

@Entity('orders')
@Index(['diningSessionId', 'status'])
@Index(['sessionComboId'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'dining_session_id' })
  diningSessionId!: string;

  @Column({ type: 'enum', enum: OrderType, name: 'order_type' })
  orderType!: OrderType;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'session_combo_id' })
  sessionComboId!: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'created_by_user_id' })
  createdByUserId!: string | null;

  @Column({ type: 'varchar', length: 20 })
  status!: OrderStatus;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => DiningSession, (diningSession) => diningSession.orders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'dining_session_id' })
  diningSession!: DiningSession;

  @ManyToOne(() => DiningSessionCombo, (sessionCombo) => sessionCombo.orders, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'session_combo_id' })
  sessionCombo!: DiningSessionCombo | null;

  @ManyToOne(() => User, (user) => user.createdOrders, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser!: User | null;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  items!: OrderItem[];

  @OneToMany(() => OrderEvent, (orderEvent) => orderEvent.order)
  events!: OrderEvent[];
}
