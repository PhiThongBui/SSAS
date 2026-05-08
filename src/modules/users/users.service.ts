import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateStaffDto } from './dto/create-staff.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  findByUsername(username: string): Promise<User | null> {
    return this.repo.findOne({ where: { username } });
  }

  verifyPassword(
    plainPassword: string,
    passwordHash: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }

  findAll(): Promise<User[]> {
    return this.repo.find({
      select: [
        'id',
        'username',
        'fullName',
        'email',
        'phone',
        'isActive',
        'createdAt',
      ],
    });
  }

  async create(dto: CreateStaffDto): Promise<User> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    return this.repo.save(
      this.repo.create({
        username: dto.username,
        fullName: dto.fullName,
        passwordHash,
      }),
    );
  }

  async deactivate(id: string): Promise<void> {
    await this.repo.update(id, { isActive: false });
  }
}
