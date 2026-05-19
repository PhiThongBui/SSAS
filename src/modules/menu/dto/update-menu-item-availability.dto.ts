import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateMenuItemAvailabilityDto {
  @ApiProperty({
    example: false,
    description: 'Whether the item is available today',
  })
  @IsBoolean()
  isAvailable!: boolean;
}
