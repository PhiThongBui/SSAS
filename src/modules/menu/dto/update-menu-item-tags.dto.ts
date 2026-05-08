import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMenuItemTagsDto {
  @ApiPropertyOptional({ example: true })
  isBestSeller?: boolean;

  @ApiPropertyOptional({ example: false })
  isNew?: boolean;

  @ApiPropertyOptional({ example: false })
  isPromo?: boolean;
}
