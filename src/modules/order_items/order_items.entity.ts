import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MenuItem } from '../menu/menu-item.entity';
import { OrderEvent } from '../order_events/order_events.entity';
import { Order, OrderStatus } from '../orders/orders.entity';

@Entity('order_items')
@Index(['orderId', 'status'])
@Index(['isCoveredByCombo'])
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'order_id' })
  orderId!: string;

  @Column({ type: 'varchar', length: 36, name: 'menu_item_id' })
  menuItemId!: string;

  @Column({ type: 'varchar', length: 200, name: 'item_name_snapshot' })
  itemNameSnapshot!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'unit_price_snapshot' })
  unitPriceSnapshot!: string;

  @Column({ type: 'int' })
  qty!: number;

  @Column({ type: 'boolean', name: 'is_covered_by_combo' })
  isCoveredByCombo!: boolean;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Column({ type: 'varchar', length: 20 })
  status!: OrderStatus;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => MenuItem, (menuItem) => menuItem.orderItems, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'menu_item_id' })
  menuItem!: MenuItem;

  @OneToMany(() => OrderEvent, (orderEvent) => orderEvent.orderItem)
  events!: OrderEvent[];
}
