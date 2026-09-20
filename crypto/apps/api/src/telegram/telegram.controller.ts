import { Controller, Get } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('bot-info')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get()
  info() {
    return { username: this.telegramService.botUsername };
  }
}
