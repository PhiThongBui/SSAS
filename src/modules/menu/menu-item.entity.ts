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
import { ComboItem } from '../combo_items/combo_items.entity';
import { MenuCategory } from '../menu-category/menu-category.entity';
import { OrderItem } from '../order_items/order_items.entity';

@Entity('menu_items')
@Index(['categoryId'])
@Index(['isActive'])
@Index(['isAvailable'])
@Index(['displayOrder'])
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'category_id' })
  categoryId!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true, name: 'image_url' })
  imageUrl!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price!: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_available' })
  isAvailable!: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_best_seller' })
  isBestSeller!: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_new' })
  isNew!: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_promo' })
  isPromo!: boolean;

  @Column({ type: 'int', default: 0, name: 'display_order' })
  displayOrder!: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => MenuCategory, (category) => category.items, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category!: MenuCategory;

  @OneToMany(() => ComboItem, (comboItem) => comboItem.menuItem)
  comboItems!: ComboItem[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.menuItem)
  orderItems!: OrderItem[];
}
