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
import { GuestSession } from '../guest_sessions/guest_sessions.entity';
import { DiningSessionCombo } from '../dining_session_combos/dining_session_combos.entity';
import { Order } from '../orders/orders.entity';
import { Table } from '../tables/tables.entity';
import { User } from '../users/user.entity';

@Entity('dining_sessions')
@Index(['tableId', 'isActive'])
export class DiningSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'table_id' })
  tableId!: string;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'guest_session_id' })
  guestSessionId!: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'opened_by_user_id' })
  openedByUserId!: string | null;

  @CreateDateColumn({ type: 'datetime', name: 'started_at' })
  startedAt!: Date;

  @Column({ type: 'datetime', nullable: true, name: 'ended_at' })
  endedAt!: Date | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @ManyToOne(() => Table, (table) => table.diningSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_id' })
  table!: Table;

  @ManyToOne(() => GuestSession, (guestSession) => guestSession.diningSessions, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'guest_session_id' })
  guestSession!: GuestSession | null;

  @ManyToOne(() => User, (user) => user.openedDiningSessions, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'opened_by_user_id' })
  openedByUser!: User | null;

  @OneToMany(() => DiningSessionCombo, (sessionCombo) => sessionCombo.diningSession)
  sessionCombos!: DiningSessionCombo[];

  @OneToMany(() => Order, (order) => order.diningSession)
  orders!: Order[];
}
