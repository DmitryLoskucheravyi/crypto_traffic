import { Module, type DynamicModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import type { AppConfig } from './config/app-config';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { PaymentsModule } from './payments/payments.module';
import { TelegramModule } from './telegram/telegram.module';

// Сервис делает ровно одно: продаёт курсы в Telegram и слушает кошелёк.
// Конфиг собирается снаружи (main.ts) и приходит сюда готовым значением —
// модуль не знает, откуда он взялся.
@Module({})
export class AppModule {
  static forRoot(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule.forRoot(config),
        MongooseModule.forRoot(config.mongoUri),
        PaymentsModule,
        TelegramModule,
        HealthModule,
      ],
    };
  }
}
