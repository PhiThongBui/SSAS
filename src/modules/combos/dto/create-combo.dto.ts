/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trimString } from '../../../helper/transform';

export class CreateComboDto {
  @ApiProperty({
    example: 'Buffet Nuong 2 Gio',
    description: 'Combo name',
  })
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 299000, description: 'Combo price' })
  @Type(() => Number)
  @Min(0)
  @Max(9999999999.99)
  price!: number;

  @ApiPropertyOptional({
    example: 'Khach duoc goi mon trong 2 gio',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({
    example: 2,
    nullable: true,
    description: 'Allowed usage hours, null means unlimited',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  validHours?: number | null;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the combo is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
