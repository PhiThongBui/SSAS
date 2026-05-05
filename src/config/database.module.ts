import { Module } from '@nestjs/common';
import { databaseProviders } from './connect.config';

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
