import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GuestSessionsService } from './guest_sessions.service';
import { CreateGuestSessionDto } from './dto/create-guest-session.dto';

@ApiTags('Guest Sessions')
@Controller('guest-sessions')
export class GuestSessionsController {
  constructor(private readonly guestSessionsService: GuestSessionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo guest session khi khách scan QR tại bàn' })
  @ApiResponse({
    status: 201,
    description: 'Tạo session thành công, trả về guest_token',
    schema: {
      example: {
        guest_token: '550e8400-e29b-41d4-a716-446655440000',
        expires_at: '2026-05-07T12:00:00.000Z',
      },
    },
  })
  async create(@Body() dto: CreateGuestSessionDto) {
    const { rawToken, expiresAt } = await this.guestSessionsService.create(
      dto.tableId,
    );
    return { guest_token: rawToken, expires_at: expiresAt };
  }
}
