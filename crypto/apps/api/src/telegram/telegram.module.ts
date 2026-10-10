import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { BotHandlers } from './bot.handlers';
import { BotRunner } from './bot-runner.service';
import { DeliveryService } from './delivery.service';
import { telegrafProvider } from './telegraf.provider';

@Module({
  imports: [PaymentsModule],
  providers: [telegrafProvider, DeliveryService, BotHandlers, BotRunner],
  exports: [BotRunner],
})
export class TelegramModule {}
