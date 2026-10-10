import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import type { Telegraf } from 'telegraf';
import { BotHandlers } from './bot.handlers';
import { DeliveryService } from './delivery.service';
import { TELEGRAF } from './telegraf.provider';

/** Пауза перед повторным запуском бота, если polling упал или нет сети. */
const RELAUNCH_DELAY_MS = 30_000;

/**
 * Жизненный цикл бота: подключить хендлеры, запустить long-polling, держать
 * его живым и остановить на выключении. Что бот отвечает — не здесь
 * (BotHandlers), как выдаёт курс — тоже не здесь (DeliveryService).
 */
@Injectable()
export class BotRunner implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(BotRunner.name);
  private stopping = false;
  username = '';

  constructor(
    @Inject(TELEGRAF) private readonly bot: Telegraf | null,
    private readonly handlers: BotHandlers,
    private readonly delivery: DeliveryService,
  ) {}

  onApplicationBootstrap(): void {
    const bot = this.bot;
    if (!bot) {
      this.logger.warn('TELEGRAM_BOT_TOKEN не задан — бот выключен');
      return;
    }

    // По умолчанию Telegraf пробрасывает ошибку хендлера наверх, и цикл
    // long-polling останавливается насовсем, а процесс и /api/health живут
    // дальше. Одна ошибка на одном апдейте не должна выключать бота для всех.
    bot.catch((error, ctx) => {
      this.logger.error(`Ошибка при обработке апдейта ${ctx.updateType}`, error as Error);
    });
    this.handlers.register(bot);

    // Не await: bot.launch() ждёт цикл long-polling и не резолвится, а без
    // связи с Telegram на старте не должен падать весь сервис вместе со
    // слушателем платежей.
    void this.keepRunning(bot);
  }

  onApplicationShutdown(): void {
    this.stopping = true;
    try {
      this.bot?.stop('shutdown');
    } catch {
      // Бот так и не запустился (Telegram был недоступен) — останавливать нечего.
    }
  }

  /** Держит бота запущенным: упал polling или нет сети — пробуем снова. */
  private async keepRunning(bot: Telegraf): Promise<void> {
    while (!this.stopping) {
      try {
        await bot.launch(() => this.onLaunched(bot));
        return;
      } catch (error) {
        if (this.stopping) return;
        this.logger.error(
          `Бот остановился, перезапуск через ${RELAUNCH_DELAY_MS / 1000} с`,
          error as Error,
        );
        await new Promise((resolve) => setTimeout(resolve, RELAUNCH_DELAY_MS));
      }
    }
  }

  private onLaunched(bot: Telegraf): void {
    this.username = bot.botInfo?.username ?? '';
    this.logger.log(`Бот @${this.username} запущен`);
    this.delivery
      .flushUndelivered()
      .catch((error) => this.logger.error('Не удалось догнать выдачу материалов', error as Error));
  }
}
