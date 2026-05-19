/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { trimString } from '../../../helper/transform';

export enum MenuItemTag {
  BestSeller = 'best_seller',
  New = 'new',
  Promo = 'promo',
}

export class ListMenuItemsQueryDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional({ enum: MenuItemTag, example: MenuItemTag.BestSeller })
  @IsOptional()
  @Transform(({ value }) => trimString(value as unknown))
  @IsEnum(MenuItemTag)
  tag?: MenuItemTag;

  @ApiPropertyOptional({
    example: false,
    type: Boolean,
    description: 'Use true to include unavailable items',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();

      if (normalized === 'true') {
        return true;
      }

      if (normalized === 'false') {
        return false;
      }
    }

    return value;
  })
  @IsBoolean()
  includeUnavailable?: boolean;
}
