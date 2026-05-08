import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuItemDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Menu category ID',
  })
  categoryId!: string;

  @ApiProperty({ example: 'Pepper beef', description: 'Menu item name' })
  name!: string;

  @ApiProperty({ example: 129000, description: 'Per-item price' })
  price!: number;

  @ApiPropertyOptional({ example: 'Tender beef with black pepper sauce', nullable: true })
  description?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/menu/bo-nuong.jpg',
    nullable: true,
  })
  imageUrl?: string | null;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the item is available today',
  })
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: false })
  isBestSeller?: boolean;

  @ApiPropertyOptional({ example: true })
  isNew?: boolean;

  @ApiPropertyOptional({ example: false })
  isPromo?: boolean;

  @ApiPropertyOptional({
    example: 10,
    description: 'Display order inside the category',
  })
  displayOrder?: number;
}
