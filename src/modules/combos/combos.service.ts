import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import {
  normalizeBoolean,
  normalizeOptionalText,
  normalizePrice,
  normalizeRequiredText,
  normalizeValidHours,
} from '../../helper/normalize';
import { CreateComboDto } from './dto/create-combo.dto';
import { UpdateComboDto } from './dto/update-combo.dto';
import { Combo } from './combos.entity';

@Injectable()
export class CombosService {
  constructor(
    @InjectRepository(Combo)
    private readonly comboRepo: Repository<Combo>,
  ) {}

  async create(dto: CreateComboDto): Promise<Combo> {
    const name = normalizeRequiredText(dto.name, 'name', 200);
    await this.ensureNameIsUnique(name);

    return this.comboRepo.save(
      this.comboRepo.create({
        name,
        price: normalizePrice(dto.price),
        description: normalizeOptionalText(dto.description),
        validHours: normalizeValidHours(dto.validHours),
        isActive:
          dto.isActive === undefined
            ? true
            : normalizeBoolean(dto.isActive, 'isActive'),
      }),
    );
  }

  findAll(): Promise<Combo[]> {
    return this.comboRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC', name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Combo> {
    return this.findActiveByIdOrFail(id);
  }

  async update(id: string, dto: UpdateComboDto): Promise<Combo> {
    const combo = await this.findActiveByIdOrFail(id);

    if (dto.name !== undefined) {
      combo.name = normalizeRequiredText(dto.name, 'name', 200);
      await this.ensureNameIsUnique(combo.name, combo.id);
    }

    if (dto.price !== undefined) {
      combo.price = normalizePrice(dto.price);
    }

    if (dto.description !== undefined) {
      combo.description = normalizeOptionalText(dto.description);
    }

    if (dto.validHours !== undefined) {
      combo.validHours = normalizeValidHours(dto.validHours);
    }

    if (dto.isActive !== undefined) {
      combo.isActive = normalizeBoolean(dto.isActive, 'isActive');
    }

    return this.comboRepo.save(combo);
  }

  async deactivate(id: string): Promise<{ message: string }> {
    const combo = await this.findActiveByIdOrFail(id);
    combo.isActive = false;
    await this.comboRepo.save(combo);
    return { message: 'Combo deactivated' };
  }

  async findActiveByIdOrFail(id: string): Promise<Combo> {
    if (typeof id !== 'string' || !id.trim()) {
      throw new BadRequestException('comboId is required');
    }

    const combo = await this.comboRepo.findOne({
      where: { id, isActive: true },
    });

    if (!combo) {
      throw new NotFoundException('Combo not found');
    }

    return combo;
  }
  private async ensureNameIsUnique(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.comboRepo.findOne({
      where: {
        name,
        isActive: true,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
    });

    if (existing) {
      throw new ConflictException('Combo name already exists');
    }
  }
}
