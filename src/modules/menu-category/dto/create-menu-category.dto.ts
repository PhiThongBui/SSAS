import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuCategoryDto {
  @ApiProperty({ example: 'Main dishes', description: 'Menu category name' })
  name!: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Display order, lower values come first',
  })
  displayOrder?: number;
}
