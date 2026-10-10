import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { PaymentsService } from './payments.service';
import { TronGridClient } from './tron/trongrid.client';

/**
 * «Слушатель» кошелька: раз в N секунд спрашивает у TronGrid, что прилетело на
 * адрес, и отдаёт переводы в PaymentsService — тот находит заказ по сумме.
 *
 * Курсор держится в памяти и стартует на TTL заказа назад: всё, что старше,
 * всё равно относится к уже просроченным заказам, а такой запас переживает
 * рестарт процесса без потери только что пришедшего платежа. Повторно
 * прочитанные переводы безопасны — settle не принимает один txId дважды.
 */
@Injectable()
export class TronWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TronWatcherService.name);
  private timer?: NodeJS.Timeout;
  private cursor = 0;
  private running = false;

  constructor(
    private readonly tron: TronGridClient,
    private readonly payments: PaymentsService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  onModuleInit(): void {
    this.cursor = Date.now() - this.config.payments.ttlMinutes * 60_000;

    if (!this.config.tron.watcherEnabled) {
      this.logger.warn(
        'TRON_WALLET_ADDRESS / TRONGRID_API_KEY не заданы — слушатель платежей выключен. ' +
          'Бот работает, заказы создаются, но закрывать их придётся вручную.',
      );
      return;
    }

    const interval = this.config.tron.pollIntervalMs;
    this.timer = setInterval(() => void this.tick(), interval);
    // unref: пустой таймер не должен держать процесс живым при выключении.
    this.timer.unref?.();
    this.logger.log(
      `Слушатель USDT TRC20 запущен: ${this.config.tron.wallet}, опрос раз в ${interval} мс`,
    );
    void this.tick();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** Один проход. Публичный, чтобы тест мог прогнать его без таймеров. */
  async tick(): Promise<void> {
    // Предыдущий проход ещё идёт (сеть подвисла) — пропускаем, иначе курсор
    // поедет вперёд на переводах, которые ещё не разобраны.
    if (this.running) return;
    this.running = true;

    try {
      await this.payments.expireStale();

      const transfers = await this.tron.fetchIncoming(this.cursor);
      if (!transfers.length) return;

      await this.payments.settle(transfers);

      const latest = Math.max(...transfers.map((t) => t.timestamp));
      // +1 мс, чтобы последний перевод не приезжал в каждой выборке заново.
      if (latest >= this.cursor) this.cursor = latest + 1;
    } catch (error) {
      this.logger.error('Проход слушателя упал', error as Error);
    } finally {
      this.running = false;
    }
  }
}
