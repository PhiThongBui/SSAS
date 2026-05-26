import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Combo } from '../combos/combos.entity';
import { MenuItem } from '../menu/menu-item.entity';

@Entity('combo_items')
@Index(['comboId', 'menuItemId'], { unique: true })
export class ComboItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'combo_id' })
  comboId!: string;

  @Column({ type: 'varchar', length: 36, name: 'menu_item_id' })
  menuItemId!: string;

  @Column({ type: 'int', nullable: true, name: 'qty_limit' })
  qtyLimit!: number | null;

  @ManyToOne(() => Combo, (combo) => combo.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'combo_id' })
  combo!: Combo;

  @ManyToOne(() => MenuItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'menu_item_id' })
  menuItem!: MenuItem;
}
