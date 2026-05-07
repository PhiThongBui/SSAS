import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { GuestSession } from './guest_sessions.entity';

const EXPIRES_IN_HOURS = 4;

@Injectable()
export class GuestSessionsService {
  constructor(
    @InjectRepository(GuestSession)
    private readonly repo: Repository<GuestSession>,
  ) {}

  async create(
    tableId: string,
  ): Promise<{ rawToken: string; expiresAt: Date }> {
    const rawToken = crypto.randomUUID();
    const guestTokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + EXPIRES_IN_HOURS * 60 * 60 * 1000);
    await this.repo.save(
      this.repo.create({ tableId, guestTokenHash, expiresAt, closedAt: null }),
    );
    return { rawToken, expiresAt };
  }

  findByRawToken(rawToken: string): Promise<GuestSession | null> {
    const guestTokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    return this.repo.findOne({ where: { guestTokenHash } });
  }

  async close(id: string): Promise<void> {
    await this.repo.update(id, { closedAt: new Date() });
  }
}
