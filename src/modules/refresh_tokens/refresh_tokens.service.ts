import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { RefreshToken } from './refresh_tokens.entity';

const EXPIRES_IN_DAYS = 7;

@Injectable()
export class RefreshTokensService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,
  ) {}

  async generate(userId: string): Promise<string> {
    const rawToken = crypto.randomUUID();
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiresAt = new Date(
      Date.now() + EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
    );
    await this.repo.save(this.repo.create({ userId, tokenHash, expiresAt }));
    return rawToken;
  }
}
