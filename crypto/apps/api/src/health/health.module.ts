import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { TelegramModule } from '../telegram/telegram.module';
import { HealthController } from './health.controller';

@Module({
  imports: [TelegramModule, PaymentsModule],
  controllers: [HealthController],
})
export class HealthModule {}
