import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'owner1', description: 'Tên đăng nhập' })
  username!: string;

  @ApiProperty({ example: 'password', description: 'Mật khẩu' })
  password!: string;
}
