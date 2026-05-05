import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { GuestSessionsModule } from './modules/guest_sessions/guest_sessions.module';
import { RefreshTokensModule } from './modules/refresh_tokens/refresh_tokens.module';
import { DatabaseModule } from './config/database.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    RolesModule,
    GuestSessionsModule,
    RefreshTokensModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
