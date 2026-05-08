import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleCode, UserRole } from './user_venue_roles.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(UserRole) private readonly repo: Repository<UserRole>,
  ) {}

  async findRolesByUserId(userId: string): Promise<RoleCode[]> {
    const rows = await this.repo.find({ where: { userId, isActive: true } });
    return rows.map((r) => r.role);
  }

  async assignRoles(userId: string, roles: RoleCode[]): Promise<void> {
    await this.repo.upsert(
      roles.map((role) => ({ userId, role })),
      ['userId', 'role'],
    );
  }
}
