import { ApiPropertyOptional } from '@nestjs/swagger';

export enum MenuItemTag {
  BestSeller = 'best_seller',
  New = 'new',
  Promo = 'promo',
}

export class ListMenuItemsQueryDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  categoryId?: string;

  @ApiPropertyOptional({ enum: MenuItemTag, example: MenuItemTag.BestSeller })
  tag?: MenuItemTag;

  @ApiPropertyOptional({
    example: false,
    type: Boolean,
    description: 'Use true to include unavailable items',
  })
  includeUnavailable?: string | boolean;
}
