import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { HealthController } from './health.controller';

@Module({
  imports: [TelegramModule],
  controllers: [HealthController],
})
export class HealthModule {}
