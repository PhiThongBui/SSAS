import { Module } from '@nestjs/common';
import { GuestSessionsService } from './guest_sessions.service';
import { GuestSessionsController } from './guest_sessions.controller';

@Module({
  controllers: [GuestSessionsController],
  providers: [GuestSessionsService],
})
export class GuestSessionsModule {}
