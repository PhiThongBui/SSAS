/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateComboItemDto {
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
