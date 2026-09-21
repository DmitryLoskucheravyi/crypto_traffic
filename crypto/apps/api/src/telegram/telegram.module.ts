import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { TelegramService } from './telegram.service';

@Module({
  imports: [PaymentsModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
