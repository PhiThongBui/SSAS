import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoleCode } from '../roles/user_venue_roles.entity';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { ListMenuItemsQueryDto } from './dto/list-menu-items-query.dto';
import { UpdateMenuItemAvailabilityDto } from './dto/update-menu-item-availability.dto';
import { UpdateMenuItemTagsDto } from './dto/update-menu-item-tags.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuService } from './menu.service';

@ApiTags('Menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('items')
  @ApiOperation({ summary: 'List active menu items' })
  findItems(@Query() query: ListMenuItemsQueryDto) {
    return this.menuService.findPublicItems(query);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Find active menu item by ID' })
  findItemById(@Param('id') id: string) {
    return this.menuService.findPublicItemById(id);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.Owner, RoleCode.Manager)
  @ApiOperation({ summary: 'Create menu item' })
  @ApiResponse({ status: 201, description: 'Menu item created successfully' })
  createItem(@Body() dto: CreateMenuItemDto) {
    return this.menuService.createItem(dto);
  }

  @Patch('items/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.Owner, RoleCode.Manager)
  @ApiOperation({ summary: 'Update menu item' })
  updateItem(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuService.updateItem(id, dto);
  }

  @Patch('items/:id/deactivate')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.Owner, RoleCode.Manager)
  @ApiOperation({ summary: 'Deactivate menu item' })
  deactivateItem(@Param('id') id: string) {
    return this.menuService.deactivateItem(id);
  }

  @Patch('items/:id/availability')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.Owner, RoleCode.Manager)
  @ApiOperation({ summary: 'Update menu item availability' })
  updateItemAvailability(
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemAvailabilityDto,
  ) {
    return this.menuService.updateItemAvailability(id, dto);
  }

  @Patch('items/:id/tags')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.Owner, RoleCode.Manager)
  @ApiOperation({ summary: 'Update menu item tags' })
  updateItemTags(@Param('id') id: string, @Body() dto: UpdateMenuItemTagsDto) {
    return this.menuService.updateItemTags(id, dto);
  }
}
