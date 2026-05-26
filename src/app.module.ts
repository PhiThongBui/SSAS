import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { GuestSessionsModule } from './modules/guest_sessions/guest_sessions.module';
import { RefreshTokensModule } from './modules/refresh_tokens/refresh_tokens.module';
import { DatabaseModule } from './config/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { TablesModule } from './modules/tables/tables.module';
import { MenuModule } from './modules/menu/menu.module';
import { MenuCategoryModule } from './modules/menu-category/menu-category.module';
import { CombosModule } from './modules/combos/combos.module';
import { ComboItemsModule } from './modules/combo_items/combo_items.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    RolesModule,
    GuestSessionsModule,
    RefreshTokensModule,
    AuthModule,
    TablesModule,
    MenuCategoryModule,
    MenuModule,
    CombosModule,
    ComboItemsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
