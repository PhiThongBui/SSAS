import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import {
  normalizeDisplayOrder,
  normalizeRequiredText,
} from '../../helper/normalize';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { MenuCategory } from './menu-category.entity';

@Injectable()
export class MenuCategoryService {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly categoryRepo: Repository<MenuCategory>,
  ) {}

  async create(dto: CreateMenuCategoryDto): Promise<MenuCategory> {
    const name = normalizeRequiredText(dto.name, 'name', 120);
    const displayOrder = normalizeDisplayOrder(dto.displayOrder);

    await this.ensureNameIsUnique(name);

    return this.categoryRepo.save(
      this.categoryRepo.create({
        name,
        displayOrder,
        isActive: true,
      }),
    );
  }

  async update(id: string, dto: UpdateMenuCategoryDto): Promise<MenuCategory> {
    const category = await this.findActiveByIdOrFail(id);

    if (dto.name !== undefined) {
      category.name = normalizeRequiredText(dto.name, 'name', 120);
      await this.ensureNameIsUnique(category.name, category.id);
    }

    if (dto.displayOrder !== undefined) {
      category.displayOrder = normalizeDisplayOrder(dto.displayOrder);
    }

    return this.categoryRepo.save(category);
  }

  async deactivate(id: string): Promise<{ message: string }> {
    const category = await this.findActiveByIdOrFail(id);
    category.isActive = false;
    await this.categoryRepo.save(category);
    return { message: 'Category deactivated' };
  }

  findPublicCategories(): Promise<MenuCategory[]> {
    return this.categoryRepo
      .createQueryBuilder('category')
      .leftJoinAndSelect(
        'category.items',
        'item',
        'item.isActive = :itemActive AND item.isAvailable = :available',
        { itemActive: true, available: true },
      )
      .where('category.isActive = :categoryActive', { categoryActive: true })
      .orderBy('category.displayOrder', 'ASC')
      .addOrderBy('category.name', 'ASC')
      .addOrderBy('item.displayOrder', 'ASC')
      .addOrderBy('item.name', 'ASC')
      .getMany();
  }

  async findActiveByIdOrFail(id: string): Promise<MenuCategory> {
    if (typeof id !== 'string' || !id.trim()) {
      throw new BadRequestException('categoryId is required');
    }

    const category = await this.categoryRepo.findOne({
      where: { id, isActive: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  private async ensureNameIsUnique(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.categoryRepo.findOne({
      where: {
        name,
        isActive: true,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
    });

    if (existing) {
      throw new ConflictException('Category name already exists');
    }
  }

}
