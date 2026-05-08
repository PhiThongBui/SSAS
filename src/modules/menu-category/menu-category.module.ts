import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuCategoryController } from './menu-category.controller';
import { MenuCategory } from './menu-category.entity';
import { MenuCategoryService } from './menu-category.service';

@Module({
  imports: [TypeOrmModule.forFeature([MenuCategory]), JwtModule],
  controllers: [MenuCategoryController],
  providers: [MenuCategoryService],
  exports: [MenuCategoryService],
})
export class MenuCategoryModule {}
