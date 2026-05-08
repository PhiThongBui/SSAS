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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoleCode } from '../roles/user_venue_roles.entity';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { MenuCategoryService } from './menu-category.service';

@ApiTags('Menu Categories')
@Controller('menu/categories')
export class MenuCategoryController {
  constructor(private readonly menuCategoryService: MenuCategoryService) {}

  @Get()
  @ApiOperation({ summary: 'List active menu categories with available items' })
  findCategories() {
    return this.menuCategoryService.findPublicCategories();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.Owner, RoleCode.Manager)
  @ApiOperation({ summary: 'Create menu category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  createCategory(@Body() dto: CreateMenuCategoryDto) {
    return this.menuCategoryService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.Owner, RoleCode.Manager)
  @ApiOperation({ summary: 'Update menu category' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateMenuCategoryDto) {
    return this.menuCategoryService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.Owner, RoleCode.Manager)
  @ApiOperation({ summary: 'Deactivate menu category' })
  deactivateCategory(@Param('id') id: string) {
    return this.menuCategoryService.deactivate(id);
  }
}
