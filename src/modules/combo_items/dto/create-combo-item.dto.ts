/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { trimString } from '../../../helper/transform';

export class CreateComboItemDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Combo ID',
  })
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @IsUUID('4')
  comboId!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Menu item ID',
  })
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @IsUUID('4')
  menuItemId!: string;

  @ApiPropertyOptional({
    example: 2,
    nullable: true,
    description: 'Allowed quantity per person/session, null means unlimited',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  qtyLimit?: number | null;
}
