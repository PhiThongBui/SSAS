import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import {
  buildTableQrCodeValue,
  buildTableQrSvg,
} from 'src/helper/table-qr-code';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoleCode } from '../roles/user_venue_roles.entity';
import { CreateTableDto } from './dto/create-table.dto';
import { TablesService } from './tables.service';

@ApiTags('Tables')
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.Owner, RoleCode.Manager)
  @ApiOperation({ summary: 'Create a table with QR code value' })
  @ApiResponse({ status: 201, description: 'Table created successfully' })
  create(@Body() dto: CreateTableDto) {
    return this.tablesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tables' })
  findAll() {
    return this.tablesService.findAll();
  }

  @Get('qr/:qrCodeValue')
  @ApiOperation({ summary: 'Find table by QR code value' })
  findByQrCodeValue(@Param('qrCodeValue') qrCodeValue: string) {
    return this.tablesService.findByQrCodeValue(qrCodeValue);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find table by ID' })
  findById(@Param('id') id: string) {
    return this.tablesService.findById(id);
  }

  @Get(':id/qr')
  @ApiOperation({ summary: 'Show table QR as SVG' })
  async getQrSvg(@Param('id') id: string, @Res() res: Response) {
    const table = await this.tablesService.findByIdOrFail(id);
    const qrCodeValue = buildTableQrCodeValue(table.tableCode);
    const qrSvg = buildTableQrSvg(qrCodeValue);

    return res
      .type('image/svg+xml')
      .setHeader('Cache-Control', 'no-store')
      .send(qrSvg);
  }
}
