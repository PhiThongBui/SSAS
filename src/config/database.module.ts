import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const port = Number(config.get<string>('DB_PORT') ?? 3306);

        return {
          type: 'mysql',
          host: config.get<string>('DB_HOST', 'localhost'),
          port: Number.isFinite(port) ? port : 3306,
          username: config.get<string>('DB_USER', 'root'),
          password: config.get<string>('DB_PASSWORD', 'root'),
          database: config.get<string>('DB_NAME', 'ssas'),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: true,
          connectTimeout: 10000,
          retryAttempts: 3,
          retryDelay: 1000,
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
