import { randomUUID } from 'crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { findCourse, type CourseTier } from '../catalog/catalog';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { allocateAmount } from './domain/amount';
import { newOrder, type Order } from './domain/order';
import type { Trc20Transfer } from './domain/transfer';
import { OrderEvents } from './order-events';
import { DuplicateAmountError, OrderRepository } from './order.repository';

export class WalletNotConfiguredError extends Error {
  constructor() {
    super('TRON_WALLET_ADDRESS не задан — принимать платежи некуда');
    this.name = 'WalletNotConfiguredError';
  }
}

/**
 * Сценарии жизни заказа: выставить, отменить, просрочить, оплатить, выдать.
 * Правила — в domain/, хранение — за OrderRepository, оповещение — через
 * OrderEvents. Здесь только их оркестровка.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly orders: OrderRepository,
    private readonly events: OrderEvents,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /**
   * Создаёт заказ с уникальной суммой. Если сумма всё же оказалась занята
   * (гонка двух одновременных /pay), хранилище отвечает DuplicateAmountError —
   * пробуем ещё раз с другим хвостом.
   */
  async createOrder(
    telegramId: number,
    tier: CourseTier,
    username?: string,
    attempts = 5,
  ): Promise<Order> {
    const course = findCourse(tier);
    if (!course) throw new Error(`Неизвестный уровень курса: ${tier}`);
    const wallet = this.config.tron.wallet;
    if (!wallet) throw new WalletNotConfiguredError();

    // Один активный заказ на человека и уровень: второй /pay подряд должен
    // вернуть ту же сумму, а не плодить ожидания на том же кошельке.
    const existing = await this.orders.findAwaiting(telegramId, tier, new Date());
    if (existing) return existing;

    const taken = await this.orders.pendingAmountKeys();

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const amount = allocateAmount(course.priceUsdt, taken);
      const order = newOrder({
        orderId: randomUUID(),
        telegramId,
        username,
        course,
        amount,
        wallet,
        ttlMinutes: this.config.payments.ttlMinutes,
        now: new Date(),
      });

      try {
        return await this.orders.insert(order);
      } catch (error) {
        if (!(error instanceof DuplicateAmountError)) throw error;
        taken.add(amount.amountKey);
      }
    }

    throw new Error('Не удалось подобрать свободную сумму — попробуйте позже');
  }

  findOrder(orderId: string): Promise<Order | null> {
    return this.orders.findById(orderId);
  }

  cancelOrder(orderId: string, telegramId: number): Promise<Order | null> {
    return this.orders.cancel(orderId, telegramId);
  }

  /** Просроченные заказы освобождают свою сумму — иначе хвосты кончатся. */
  expireStale(now = new Date()): Promise<number> {
    return this.orders.expire(now);
  }

  /**
   * Сопоставляет пришедшие переводы с заказами и сообщает об оплаченных.
   * Возвращает заказы, которые закрылись этим вызовом.
   */
  async settle(transfers: readonly Trc20Transfer[]): Promise<Order[]> {
    const paid: Order[] = [];

    for (const transfer of transfers) {
      // Одна транзакция закрывает не больше одного заказа: после рестарта
      // слушатель перечитывает уже разобранные переводы.
      if (await this.orders.isTxUsed(transfer.txId)) continue;

      const order = await this.orders.claimPaid(transfer);
      if (!order) continue;

      this.logger.log(
        `Заказ ${order.orderId} (${order.tier}) оплачен: ${transfer.amountKey} USDT, tx ${transfer.txId}`,
      );
      paid.push(order);
    }

    for (const order of paid) await this.events.emitPaid(order);

    return paid;
  }

  markNotified(orderId: string): Promise<void> {
    return this.orders.markNotified(orderId);
  }

  markDelivered(orderId: string): Promise<void> {
    return this.orders.markDelivered(orderId);
  }

  /**
   * Оплаченные, но ещё не выданные заказы. Нужны на старте: если процесс упал
   * между «платёж принят» и «файл отправлен», материалы всё равно уедут.
   */
  findUndelivered(): Promise<Order[]> {
    return this.orders.findUndelivered();
  }
}
