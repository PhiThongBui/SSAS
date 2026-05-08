import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGuestSessionDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID của bàn khách đang ngồi',
  })
  tableId?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Giá trị QR code của bàn, dùng cho luồng scan QR thực tế',
  })
  qrCodeValue?: string;
}
