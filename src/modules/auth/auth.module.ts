import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { RefreshTokensModule } from '../refresh_tokens/refresh_tokens.module';
import { GuestSessionsModule } from '../guest_sessions/guest_sessions.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { GuestAuthGuard } from './guards/guest-auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<number>('EXPIRES_IN') },
      }),
    }),
    UsersModule,
    RolesModule,
    RefreshTokensModule,
    GuestSessionsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard, GuestAuthGuard],
  exports: [JwtAuthGuard, RolesGuard, GuestAuthGuard],
})
export class AuthModule {}
