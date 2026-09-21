import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsModule } from './payments/payments.module';
import { TelegramModule } from './telegram/telegram.module';
import { HealthModule } from './health/health.module';

// Сервис делает ровно одно: продаёт курсы в Telegram и слушает кошелёк.
// Контент лендинга здесь больше не живёт — он статический (apps/web),
// а Mongo осталась только под заказы.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: join(__dirname, '../../../.env') }),
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    PaymentsModule,
    TelegramModule,
    HealthModule,
  ],
})
export class AppModule {}
