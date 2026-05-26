import {
  Body,
  Controller,
  Delete,
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
import { ComboItemsService } from './combo_items.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoleCode } from '../roles/user_venue_roles.entity';
import { CreateComboItemDto } from './dto/create-combo-item.dto';
import { UpdateComboItemDto } from './dto/update-combo-item.dto';

@ApiTags('Combo Items')
@Controller('combo-items')
export class ComboItemsController {
  constructor(private readonly comboItemsService: ComboItemsService) {}

  @Get('combo/:comboId')
  @ApiOperation({ summary: 'List items assigned to a combo' })
  findByComboId(@Param('comboId') comboId: string) {
    return this.comboItemsService.findByComboId(comboId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.Owner, RoleCode.Manager)
  @ApiOperation({ summary: 'Assign a menu item to a combo' })
  @ApiResponse({ status: 201, description: 'Combo item created successfully' })
  create(@Body() dto: CreateComboItemDto) {
    return this.comboItemsService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.Owner, RoleCode.Manager)
  @ApiOperation({ summary: 'Update combo item quantity limit' })
  update(@Param('id') id: string, @Body() dto: UpdateComboItemDto) {
    return this.comboItemsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.Owner, RoleCode.Manager)
  @ApiOperation({ summary: 'Remove a menu item from a combo' })
  remove(@Param('id') id: string) {
    return this.comboItemsService.remove(id);
  }
}
