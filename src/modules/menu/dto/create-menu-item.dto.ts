/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
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

export class CreateMenuItemDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Menu category ID',
  })
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @IsNotEmpty()
  @IsUUID('4')
  categoryId!: string;

  @ApiProperty({ example: 'Pepper beef', description: 'Menu item name' })
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 129000, description: 'Per-item price' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999.99)
  price!: number;

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
    example: true,
    description: 'Whether the item is available today',
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isBestSeller?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPromo?: boolean;

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
