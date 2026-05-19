import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateMenuItemTagsDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional ()
  @IsBoolean()
  isBestSeller?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional ()
  @IsBoolean()
  isNew?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional ()
  @IsBoolean()
  isPromo?: boolean;
}
