/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { trimString } from '../../../helper/transform';

export class CreateGuestSessionDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Table ID',
  })
  @Transform(({ value }) => trimString(value as unknown))
  @ValidateIf(
    (dto: CreateGuestSessionDto) =>
      !dto.qrCodeValue || dto.tableId !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @IsUUID('4')
  tableId?: string;

  @ApiPropertyOptional({
    example: 'TABLE-A1',
    description: 'Table QR code value',
  })
  @Transform(({ value }) => trimString(value as unknown))
  @ValidateIf(
    (dto: CreateGuestSessionDto) =>
      !dto.tableId || dto.qrCodeValue !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  qrCodeValue?: string;
}
