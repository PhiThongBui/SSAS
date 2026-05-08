import { ApiProperty } from '@nestjs/swagger';
import { RoleCode } from '../../roles/user_venue_roles.entity';

export class CreateStaffDto {
  @ApiProperty({ example: 'waiter1', description: 'Tên đăng nhập' })
  username!: string;

  @ApiProperty({ example: 'password123', description: 'Mật khẩu (plain text)' })
  password!: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ tên đầy đủ' })
  fullName!: string;

  @ApiProperty({
    example: ['waiter'],
    description: 'Danh sách role của staff',
    enum: RoleCode,
    isArray: true,
  })
  roles!: RoleCode[];
}
