import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { TronService } from './tron.service';

const DEFAULT_POLL_MS = 20_000;

/**
 * «Слушатель» кошелька: раз в N секунд спрашивает у TronGrid, что прилетело на
 * адрес, и отдаёт переводы в PaymentsService — тот находит заказ по сумме.
 *
 * Курсор держится в памяти и стартует на TTL заказа назад: всё, что старше,
 * всё равно относится к уже просроченным заказам, а такой запас переживает
 * рестарт процесса без потери только что пришедшего платежа.
 */
@Injectable()
export class TronWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TronWatcherService.name);
  private timer?: NodeJS.Timeout;
  private cursor = 0;
  private running = false;

  constructor(
    private readonly tron: TronService,
    private readonly payments: PaymentsService,
  ) {}

  get pollIntervalMs(): number {
    const raw = Number(process.env.PAYMENT_POLL_INTERVAL_MS);
    return Number.isFinite(raw) && raw >= 5_000 ? raw : DEFAULT_POLL_MS;
  }

  onModuleInit(): void {
    this.cursor = Date.now() - this.payments.ttlMinutes * 60_000;

    if (!this.tron.configured) {
      this.logger.warn(
        'TRON_WALLET_ADDRESS / TRONGRID_API_KEY не заданы — слушатель платежей выключен. ' +
          'Бот работает, заказы создаются, но закрывать их придётся вручную.',
      );
      return;
    }

    this.timer = setInterval(() => void this.tick(), this.pollIntervalMs);
    // unref: пустой таймер не должен держать процесс живым при выключении.
    this.timer.unref?.();
    this.logger.log(
      `Слушатель USDT TRC20 запущен: ${this.tron.wallet}, опрос раз в ${this.pollIntervalMs} мс`,
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
