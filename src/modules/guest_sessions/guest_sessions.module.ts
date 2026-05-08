import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuestSessionsService } from './guest_sessions.service';
import { GuestSessionsController } from './guest_sessions.controller';
import { GuestSession } from './guest_sessions.entity';
import { TablesModule } from '../tables/tables.module';

@Module({
  imports: [TypeOrmModule.forFeature([GuestSession]), TablesModule],
  controllers: [GuestSessionsController],
  providers: [GuestSessionsService],
  exports: [GuestSessionsService],
})
export class GuestSessionsModule {}
