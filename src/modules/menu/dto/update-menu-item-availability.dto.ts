import { ApiProperty } from '@nestjs/swagger';

export class UpdateMenuItemAvailabilityDto {
  @ApiProperty({
    example: false,
    description: 'Whether the item is available today',
  })
  isAvailable!: boolean;
}
