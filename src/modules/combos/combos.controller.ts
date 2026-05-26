import {
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
import { CombosService } from './combos.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoleCode } from '../roles/user_venue_roles.entity';
import { CreateComboDto } from './dto/create-combo.dto';
import { UpdateComboDto } from './dto/update-combo.dto';

@ApiTags('Combos')
@Controller('combos')
export class CombosController {
  constructor(private readonly combosService: CombosService) {}

  @Get()
  @ApiOperation({ summary: 'List active combos' })
  findAll() {
    return this.combosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find active combo by ID' })
  findById(@Param('id') id: string) {
    return this.combosService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.Owner, RoleCode.Manager)
  @ApiOperation({ summary: 'Create combo' })
  @ApiResponse({ status: 201, description: 'Combo created successfully' })
  create(@Body() dto: CreateComboDto) {
    return this.combosService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.Owner, RoleCode.Manager)
  @ApiOperation({ summary: 'Update combo' })
  update(@Param('id') id: string, @Body() dto: UpdateComboDto) {
    return this.combosService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.Owner, RoleCode.Manager)
  @ApiOperation({ summary: 'Deactivate combo' })
  deactivate(@Param('id') id: string) {
    return this.combosService.deactivate(id);
  }
}
