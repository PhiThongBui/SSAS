import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Table } from '../tables/tables.entity';

@Entity('guest_sessions')
export class GuestSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'table_id' })
  tableId!: string;

  @ManyToOne(() => Table, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_id' })
  table!: Table;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'guest_token_hash' })
  guestTokenHash!: string;

  @Column({ type: 'datetime', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'datetime', nullable: true, name: 'closed_at' })
  closedAt!: Date | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date;
}
