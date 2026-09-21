import { Controller, Get } from '@nestjs/common';
import { CATALOG } from '../catalog/catalog';
import { TronService } from '../payments/tron.service';
import { TelegramService } from '../telegram/telegram.service';

// Единственная HTTP-ручка, которая осталась: лендинг статический и в API не
// ходит, поэтому наружу нужен только признак «сервис жив и в каком состоянии».
@Controller('health')
export class HealthController {
  constructor(
    private readonly telegram: TelegramService,
    private readonly tron: TronService,
  ) {}

  @Get()
  status() {
    return {
      status: 'ok',
      bot: this.telegram.botUsername || null,
      courses: CATALOG.length,
      paymentsWatcher: this.tron.configured ? 'on' : 'off',
    };
  }
}
