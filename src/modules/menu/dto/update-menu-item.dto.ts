/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trimString } from '../../../helper/transform';

export class UpdateMenuItemDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Menu category ID',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'Pepper beef',
    description: 'Menu item name',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 129000, description: 'Per-item price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999.99)
  price?: number;

  @ApiPropertyOptional({
    example: 'Tender beef with black pepper sauce',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/menu/bo-nuong.jpg',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @IsUrl()
  @MaxLength(2048)
  imageUrl?: string | null;

  @ApiPropertyOptional({
    example: 10,
    description: 'Display order inside the category',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  @Max(100000)
  displayOrder?: number;
}
