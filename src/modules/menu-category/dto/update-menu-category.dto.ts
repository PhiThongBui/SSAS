import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMenuCategoryDto {
  @ApiPropertyOptional({
    example: 'Grilled dishes',
    description: 'Category name',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 20,
    description: 'Display order, lower values come first',
  })
  displayOrder?: number;
}
