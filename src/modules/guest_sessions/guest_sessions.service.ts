import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { GuestSession } from './guest_sessions.entity';
import { TablesService } from '../tables/tables.service';
import { CreateGuestSessionDto } from './dto/create-guest-session.dto';

const EXPIRES_IN_HOURS = 4;

@Injectable()
export class GuestSessionsService {
  constructor(
    @InjectRepository(GuestSession)
    private readonly repo: Repository<GuestSession>,
    private readonly tablesService: TablesService,
  ) {}

  async create(
    input: CreateGuestSessionDto,
  ): Promise<{ rawToken: string; expiresAt: Date }> {
    const tableId = await this.resolveTableId(input);
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

  private async resolveTableId(input: CreateGuestSessionDto): Promise<string> {
    if (input.tableId) {
      return input.tableId;
    }

    if (input.qrCodeValue) {
      const table = await this.tablesService.findByQrCodeValue(
        input.qrCodeValue,
      );

      if (!table) {
        throw new NotFoundException('Không tìm thấy bàn với QR code này');
      }

      return table.id;
    }

    throw new BadRequestException('Cần cung cấp tableId hoặc qrCodeValue');
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
