import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { normalizeNullablePositiveInteger } from '../../helper/normalize';
import { CombosService } from '../combos/combos.service';
import { MenuService } from '../menu/menu.service';
import { CreateComboItemDto } from './dto/create-combo-item.dto';
import { UpdateComboItemDto } from './dto/update-combo-item.dto';
import { ComboItem } from './combo_items.entity';

@Injectable()
export class ComboItemsService {
  constructor(
    @InjectRepository(ComboItem)
    private readonly comboItemRepo: Repository<ComboItem>,
    private readonly combosService: CombosService,
    private readonly menuService: MenuService,
  ) {}

  async create(dto: CreateComboItemDto): Promise<ComboItem> {
    await this.combosService.findActiveByIdOrFail(dto.comboId);
    await this.menuService.findActiveItemOrFail(dto.menuItemId);

    const existing = await this.comboItemRepo.findOne({
      where: {
        comboId: dto.comboId,
        menuItemId: dto.menuItemId,
      },
    });

    if (existing) {
      throw new ConflictException('Menu item is already assigned to this combo');
    }

    const comboItem = await this.comboItemRepo.save(
      this.comboItemRepo.create({
        comboId: dto.comboId,
        menuItemId: dto.menuItemId,
        qtyLimit: normalizeNullablePositiveInteger(dto.qtyLimit, 'qtyLimit'),
      }),
    );

    return this.findByIdOrFail(comboItem.id);
  }

  findByComboId(comboId: string): Promise<ComboItem[]> {
    if (typeof comboId !== 'string' || !comboId.trim()) {
      throw new BadRequestException('comboId is required');
    }

    return this.comboItemRepo.find({
      where: { comboId },
      relations: { combo: true, menuItem: true },
      order: {
        menuItem: {
          displayOrder: 'ASC',
          name: 'ASC',
        },
      },
    });
  }

  async update(id: string, dto: UpdateComboItemDto): Promise<ComboItem> {
    const comboItem = await this.findByIdOrFail(id);

    if (dto.qtyLimit !== undefined) {
      comboItem.qtyLimit = normalizeNullablePositiveInteger(
        dto.qtyLimit,
        'qtyLimit',
      );
    }

    await this.comboItemRepo.save(comboItem);
    return this.findByIdOrFail(comboItem.id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const comboItem = await this.findByIdOrFail(id);
    await this.comboItemRepo.remove(comboItem);
    return { message: 'Combo item removed' };
  }

  private async findByIdOrFail(id: string): Promise<ComboItem> {
    if (typeof id !== 'string' || !id.trim()) {
      throw new BadRequestException('comboItemId is required');
    }

    const comboItem = await this.comboItemRepo.findOne({
      where: { id },
      relations: { combo: true, menuItem: true },
    });

    if (!comboItem) {
      throw new NotFoundException('Combo item not found');
    }

    return comboItem;
  }
}
