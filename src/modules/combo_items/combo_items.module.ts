import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CombosModule } from '../combos/combos.module';
import { MenuModule } from '../menu/menu.module';
import { ComboItemsService } from './combo_items.service';
import { ComboItemsController } from './combo_items.controller';
import { ComboItem } from './combo_items.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ComboItem]),
    JwtModule,
    CombosModule,
    MenuModule,
  ],
  controllers: [ComboItemsController],
  providers: [ComboItemsService],
  exports: [ComboItemsService],
})
export class ComboItemsModule {}
