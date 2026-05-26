import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Combo } from '../combos/combos.entity';
import { DiningSession } from '../dining_sessions/dining_sessions.entity';
import { Order } from '../orders/orders.entity';

@Entity('dining_session_combos')
@Index(['diningSessionId'])
@Index(['expiresAt'])
export class DiningSessionCombo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'dining_session_id' })
  diningSessionId!: string;

  @Column({ type: 'varchar', length: 36, name: 'combo_id' })
  comboId!: string;

  @Column({ type: 'int', name: 'person_count' })
  personCount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'unit_price_snapshot' })
  unitPriceSnapshot!: string;

  @Column({ type: 'datetime', name: 'started_at' })
  startedAt!: Date;

  @Column({ type: 'datetime', nullable: true, name: 'expires_at' })
  expiresAt!: Date | null;

  @ManyToOne(() => DiningSession, (diningSession) => diningSession.sessionCombos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'dining_session_id' })
  diningSession!: DiningSession;

  @ManyToOne(() => Combo, (combo) => combo.sessionCombos, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'combo_id' })
  combo!: Combo;

  @OneToMany(() => Order, (order) => order.sessionCombo)
  orders!: Order[];
}
