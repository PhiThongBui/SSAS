import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableStatus } from '../tables.entity';

export class CreateTableDto {
  @ApiProperty({ example: 'A1', description: 'Mã bàn' })
  tableCode!: string;

  @ApiProperty({ example: 'Bàn A1', description: 'Tên hiển thị của bàn' })
  tableName!: string;

  @ApiPropertyOptional({ example: 4, description: 'Sức chứa của bàn' })
  capacity?: number;

  @ApiPropertyOptional({
    example: TableStatus.Available,
    enum: TableStatus,
    description: 'Trạng thái của bàn',
  })
  status?: TableStatus;

  @ApiPropertyOptional({
    example: true,
    description: 'Bàn có đang hoạt động',
  })
  isActive?: boolean;
}
