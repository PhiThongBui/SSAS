import { Module } from '@nestjs/common';
import { RefreshTokensService } from './refresh_tokens.service';
import { RefreshTokensController } from './refresh_tokens.controller';

@Module({
  controllers: [RefreshTokensController],
  providers: [RefreshTokensService],
})
export class RefreshTokensModule {}
