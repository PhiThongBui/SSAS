import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { RolesService } from '../roles/roles.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { RoleCode } from '../roles/user_venue_roles.entity';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.Owner)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo tài khoản staff mới (chỉ owner)' })
  @ApiResponse({
    status: 201,
    description: 'Tạo tài khoản thành công',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        username: 'waiter1',
        fullName: 'Nguyễn Văn A',
        roles: ['waiter'],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền owner' })
  async create(@Body() dto: CreateStaffDto) {
    const user = await this.usersService.create(dto);
    await this.rolesService.assignRoles(user.id, dto.roles);
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      roles: dto.roles,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.Owner)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Danh sách tất cả staff (chỉ owner)' })
  @ApiResponse({ status: 200, description: 'Danh sách staff' })
  @ApiResponse({ status: 403, description: 'Không có quyền owner' })
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.Owner)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Vô hiệu hoá tài khoản staff (chỉ owner)' })
  @ApiResponse({ status: 200, description: 'Đã vô hiệu hoá' })
  @ApiResponse({ status: 403, description: 'Không có quyền owner' })
  async deactivate(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    if (id === currentUser.id) {
      throw new BadRequestException(
        'Owner không thể vô hiệu hoá tài khoản của chính mình',
      );
    }
    await this.usersService.deactivate(id);
    return { message: 'Đã vô hiệu hoá tài khoản' };
  }
}
