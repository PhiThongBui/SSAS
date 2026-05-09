/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trimString } from '../../../helper/transform';
import { TableStatus } from '../tables.entity';

export class CreateTableDto {
  @ApiProperty({ example: 'A1', description: 'Table code' })
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'tableCode can only contain letters, numbers, dots, underscores, and hyphens',
  })
  tableCode!: string;

  @ApiProperty({ example: 'Table A1', description: 'Display table name' })
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tableName!: string;

  @ApiPropertyOptional({ example: 4, description: 'Table capacity' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  capacity?: number;

  @ApiPropertyOptional({
    example: TableStatus.Available,
    enum: TableStatus,
    description: 'Table status',
  })
  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the table is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
