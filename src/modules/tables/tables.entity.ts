import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum TableStatus {
  Available = 'available',
  Occupied = 'occupied',
  Reserved = 'reserved',
  Disabled = 'disabled',
}

@Entity('tables')
@Index(['tableCode'], { unique: true })
@Index(['qrCodeValue'], { unique: true })
@Index(['status'])
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, name: 'table_code' })
  tableCode!: string;

  @Column({ type: 'varchar', length: 100, name: 'table_name' })
  tableName!: string;

  @Column({ type: 'int', nullable: true })
  capacity!: number | null;

  @Column({ type: 'enum', enum: TableStatus, default: TableStatus.Available })
  status!: TableStatus;

  @Column({ type: 'varchar', length: 255, name: 'qr_code_value' })
  qrCodeValue!: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;
}
