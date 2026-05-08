import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuCategoryModule } from '../menu-category/menu-category.module';
import { MenuController } from './menu.controller';
import { MenuItem } from './menu-item.entity';
import { MenuService } from './menu.service';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItem]), JwtModule, MenuCategoryModule],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
