import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum RoleCode {
  Owner = 'owner',
  Manager = 'manager',
  Staff = 'staff',
}

@Entity('user_venue_roles')
@Index(['userId', 'venueId', 'role'], { unique: true })
export class UserVenueRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 36, name: 'venue_id' })
  venueId!: string;

  @Column({ type: 'enum', enum: RoleCode, enumName: 'role_code' })
  role!: RoleCode;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
