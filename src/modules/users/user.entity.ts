import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
  PreferNotToSay = 'prefer_not_to_say',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: true, name: 'password_hash' })
  passwordHash!: string | null;

  @Column({ type: 'varchar', length: 150, name: 'full_name' })
  fullName!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender!: Gender | null;

  @Column({ type: 'varchar', length: 80, unique: true, nullable: true })
  njkname!: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt!: Date;
}
