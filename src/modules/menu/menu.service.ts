import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { MenuCategoryService } from '../menu-category/menu-category.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import {
  ListMenuItemsQueryDto,
  MenuItemTag,
} from './dto/list-menu-items-query.dto';
import { UpdateMenuItemAvailabilityDto } from './dto/update-menu-item-availability.dto';
import { UpdateMenuItemTagsDto } from './dto/update-menu-item-tags.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItem } from './menu-item.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly itemRepo: Repository<MenuItem>,
    private readonly menuCategoryService: MenuCategoryService,
  ) {}

  async createItem(dto: CreateMenuItemDto): Promise<MenuItem> {
    const category = await this.menuCategoryService.findActiveByIdOrFail(
      dto.categoryId,
    );
    const name = this.normalizeRequiredText(dto.name, 'name', 200);
    const price = this.normalizePrice(dto.price);
    const displayOrder = this.normalizeDisplayOrder(dto.displayOrder);

    return this.itemRepo.save(
      this.itemRepo.create({
        categoryId: category.id,
        name,
        price,
        description: this.normalizeOptionalText(dto.description),
        imageUrl: this.normalizeOptionalText(dto.imageUrl),
        isActive: true,
        isAvailable:
          dto.isAvailable === undefined
            ? true
            : this.normalizeBoolean(dto.isAvailable, 'isAvailable'),
        isBestSeller:
          dto.isBestSeller === undefined
            ? false
            : this.normalizeBoolean(dto.isBestSeller, 'isBestSeller'),
        isNew:
          dto.isNew === undefined
            ? false
            : this.normalizeBoolean(dto.isNew, 'isNew'),
        isPromo:
          dto.isPromo === undefined
            ? false
            : this.normalizeBoolean(dto.isPromo, 'isPromo'),
        displayOrder,
      }),
    );
  }

  async updateItem(id: string, dto: UpdateMenuItemDto): Promise<MenuItem> {
    const item = await this.findActiveItemOrFail(id);

    if (dto.categoryId !== undefined) {
      const category = await this.menuCategoryService.findActiveByIdOrFail(
        dto.categoryId,
      );
      item.categoryId = category.id;
    }

    if (dto.name !== undefined) {
      item.name = this.normalizeRequiredText(dto.name, 'name', 200);
    }

    if (dto.price !== undefined) {
      item.price = this.normalizePrice(dto.price);
    }

    if (dto.description !== undefined) {
      item.description = this.normalizeOptionalText(dto.description);
    }

    if (dto.imageUrl !== undefined) {
      item.imageUrl = this.normalizeOptionalText(dto.imageUrl);
    }

    if (dto.displayOrder !== undefined) {
      item.displayOrder = this.normalizeDisplayOrder(dto.displayOrder);
    }

    return this.itemRepo.save(item);
  }

  async deactivateItem(id: string): Promise<{ message: string }> {
    const item = await this.findActiveItemOrFail(id);
    item.isActive = false;
    await this.itemRepo.save(item);
    return { message: 'Menu item deactivated' };
  }

  async updateItemAvailability(
    id: string,
    dto: UpdateMenuItemAvailabilityDto,
  ): Promise<MenuItem> {
    const item = await this.findActiveItemOrFail(id);

    if (typeof dto.isAvailable !== 'boolean') {
      throw new BadRequestException('isAvailable must be a boolean');
    }

    item.isAvailable = dto.isAvailable;
    return this.itemRepo.save(item);
  }

  async updateItemTags(
    id: string,
    dto: UpdateMenuItemTagsDto,
  ): Promise<MenuItem> {
    const item = await this.findActiveItemOrFail(id);

    if (dto.isBestSeller !== undefined) {
      item.isBestSeller = this.normalizeBoolean(
        dto.isBestSeller,
        'isBestSeller',
      );
    }

    if (dto.isNew !== undefined) {
      item.isNew = this.normalizeBoolean(dto.isNew, 'isNew');
    }

    if (dto.isPromo !== undefined) {
      item.isPromo = this.normalizeBoolean(dto.isPromo, 'isPromo');
    }

    return this.itemRepo.save(item);
  }

  findPublicItems(query: ListMenuItemsQueryDto): Promise<MenuItem[]> {
    const includeUnavailable =
      query.includeUnavailable === true || query.includeUnavailable === 'true';

    const qb = this.itemRepo
      .createQueryBuilder('item')
      .innerJoinAndSelect('item.category', 'category')
      .where('item.isActive = :itemActive', { itemActive: true })
      .andWhere('category.isActive = :categoryActive', {
        categoryActive: true,
      });

    if (!includeUnavailable) {
      qb.andWhere('item.isAvailable = :available', { available: true });
    }

    if (query.categoryId) {
      qb.andWhere('item.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.tag) {
      this.applyTagFilter(qb, query.tag);
    }

    return qb
      .orderBy('category.displayOrder', 'ASC')
      .addOrderBy('item.displayOrder', 'ASC')
      .addOrderBy('item.name', 'ASC')
      .getMany();
  }

  async findPublicItemById(id: string): Promise<MenuItem> {
    const item = await this.itemRepo
      .createQueryBuilder('item')
      .innerJoinAndSelect('item.category', 'category')
      .where('item.id = :id', { id })
      .andWhere('item.isActive = :itemActive', { itemActive: true })
      .andWhere('category.isActive = :categoryActive', {
        categoryActive: true,
      })
      .getOne();

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return item;
  }

  private async findActiveItemOrFail(id: string): Promise<MenuItem> {
    const item = await this.itemRepo.findOne({
      where: { id, isActive: true },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return item;
  }

  private normalizeRequiredText(
    value: unknown,
    field: string,
    maxLength: number,
  ): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${field} is required`);
    }

    const normalized = value.trim();
    if (normalized.length > maxLength) {
      throw new BadRequestException(
        `${field} must be at most ${maxLength} characters`,
      );
    }

    return normalized;
  }

  private normalizeOptionalText(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('Optional text fields must be strings');
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeDisplayOrder(value: unknown): number {
    if (value === undefined || value === null) {
      return 0;
    }

    if (typeof value !== 'number' || !Number.isInteger(value)) {
      throw new BadRequestException('displayOrder must be an integer');
    }

    return value;
  }

  private normalizePrice(value: unknown): string {
    const numericValue =
      typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

    if (
      typeof numericValue !== 'number' ||
      !Number.isFinite(numericValue) ||
      numericValue < 0
    ) {
      throw new BadRequestException('price must be a non-negative number');
    }

    return numericValue.toFixed(2);
  }

  private normalizeBoolean(value: unknown, field: string): boolean {
    if (typeof value !== 'boolean') {
      throw new BadRequestException(`${field} must be a boolean`);
    }

    return value;
  }

  private applyTagFilter(
    qb: SelectQueryBuilder<MenuItem>,
    tag: MenuItemTag,
  ): void {
    if (tag === MenuItemTag.BestSeller) {
      qb.andWhere('item.isBestSeller = :tagged', { tagged: true });
      return;
    }

    if (tag === MenuItemTag.New) {
      qb.andWhere('item.isNew = :tagged', { tagged: true });
      return;
    }

    if (tag === MenuItemTag.Promo) {
      qb.andWhere('item.isPromo = :tagged', { tagged: true });
      return;
    }

    throw new BadRequestException('tag has invalid value');
  }
}
