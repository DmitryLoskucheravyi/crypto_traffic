import { Controller, Get, Inject } from '@nestjs/common';
import { CATALOG } from '../catalog/catalog';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { BotRunner } from '../telegram/bot-runner.service';

// Единственная HTTP-ручка: лендинг статический и в API не ходит, поэтому
// наружу нужен только признак «сервис жив и в каком состоянии».
@Controller('health')
export class HealthController {
  constructor(
    private readonly bot: BotRunner,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Get()
  status() {
    return {
      status: 'ok',
      bot: this.bot.username || null,
      courses: CATALOG.length,
      paymentsWatcher: this.config.tron.watcherEnabled ? 'on' : 'off',
    };
  }
}
