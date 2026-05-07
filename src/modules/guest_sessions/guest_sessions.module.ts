import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuestSessionsService } from './guest_sessions.service';
import { GuestSessionsController } from './guest_sessions.controller';
import { GuestSession } from './guest_sessions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GuestSession])],
  controllers: [GuestSessionsController],
  providers: [GuestSessionsService],
  exports: [GuestSessionsService],
})
export class GuestSessionsModule {}
