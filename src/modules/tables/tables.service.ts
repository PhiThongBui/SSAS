import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTableDto } from './dto/create-table.dto';
import { Table, TableStatus } from './tables.entity';
import { buildTableQrCodeValue } from 'src/helper/table-qr-code';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(Table)
    private readonly repo: Repository<Table>,
  ) {}

  async create(dto: CreateTableDto): Promise<Table> {
    // Basic required fields
    if (!dto.tableCode || !dto.tableCode.trim()) {
      throw new BadRequestException('tableCode is required');
    }
    if (!dto.tableName || !dto.tableName.trim()) {
      throw new BadRequestException('tableName is required');
    }

    // capacity validation
    if (dto.capacity !== undefined && dto.capacity !== null) {
      if (!Number.isInteger(dto.capacity) || dto.capacity < 0) {
        throw new BadRequestException(
          'capacity must be a non-negative integer',
        );
      }
    }

    // status validation
    if (dto.status !== undefined && dto.status !== null) {
      const validStatuses = Object.values(TableStatus) as string[];
      if (!validStatuses.includes(dto.status)) {
        throw new BadRequestException('status has invalid value');
      }
    }

    // Check duplicate tableCode
    const existing = await this.repo.findOne({
      where: { tableCode: dto.tableCode },
    });
    if (existing) {
      throw new ConflictException('tableCode already exists');
    }

    const qrCodeValue = buildTableQrCodeValue(dto.tableCode);

    // Check duplicate qrCodeValue (very unlikely)
    const existingQr = await this.repo.findOne({ where: { qrCodeValue } });
    if (existingQr) {
      throw new ConflictException('Generated qrCodeValue already exists');
    }

    return this.repo.save(
      this.repo.create({
        tableCode: dto.tableCode,
        tableName: dto.tableName,
        capacity: dto.capacity ?? null,
        status: dto.status ?? undefined,
        qrCodeValue,
        isActive: dto.isActive ?? true,
      }),
    );
  }

  findAll(): Promise<Table[]> {
    return this.repo.find({ order: { tableCode: 'ASC' } });
  }

  findById(id: string): Promise<Table | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<Table> {
    const table = await this.findById(id);

    if (!table) {
      throw new NotFoundException('Bàn không tồn tại');
    }

    return table;
  }

  findByQrCodeValue(qrCodeValue: string): Promise<Table | null> {
    return this.repo.findOne({ where: { qrCodeValue } });
  }
}
