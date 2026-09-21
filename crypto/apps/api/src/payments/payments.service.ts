import { randomUUID } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { findCourse, type CourseTier } from '../catalog/catalog';
import { allocateAmount } from './amount';
import { Order, OrderDocument } from './order.schema';
import type { Trc20Transfer } from './tron.service';

/** Сколько заказ ждёт оплаты, прежде чем его сумма освободится. */
const DEFAULT_TTL_MINUTES = 60;

export type PaidHandler = (order: Order) => void | Promise<void>;

export class WalletNotConfiguredError extends Error {
  constructor() {
    super('TRON_WALLET_ADDRESS не задан — принимать платежи некуда');
    this.name = 'WalletNotConfiguredError';
  }
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly paidHandlers: PaidHandler[] = [];

  constructor(@InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>) {}

  get wallet(): string {
    return process.env.TRON_WALLET_ADDRESS ?? '';
  }

  get ttlMinutes(): number {
    const raw = Number(process.env.PAYMENT_TTL_MINUTES);
    return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TTL_MINUTES;
  }

  /**
   * Подписка на «заказ оплачен». Через неё бот узнаёт, кому выдавать материалы,
   * и это единственная связь платежей с телеграмом — иначе модули пришлось бы
   * импортировать по кругу.
   */
  onPaid(handler: PaidHandler): void {
    this.paidHandlers.push(handler);
  }

  /**
   * Создаёт заказ с уникальной суммой. Если сумма всё же оказалась занята
   * (гонка двух одновременных /pay), уникальный индекс по `amountKey` роняет
   * запись — пробуем ещё раз с другим хвостом.
   */
  async createOrder(
    telegramId: number,
    tier: CourseTier,
    username?: string,
    attempts = 5,
  ): Promise<Order> {
    const course = findCourse(tier);
    if (!course) throw new Error(`Неизвестный уровень курса: ${tier}`);
    if (!this.wallet) throw new WalletNotConfiguredError();

    // Один активный заказ на человека и уровень: второй /pay подряд должен
    // вернуть ту же сумму, а не плодить ожидания на том же кошельке.
    const existing = await this.findActiveOrder(telegramId, tier);
    if (existing) return existing;

    const taken = await this.pendingAmountKeys();

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const { amount, amountKey } = allocateAmount(course.priceUsdt, taken);

      try {
        const created = await this.orderModel.create({
          orderId: randomUUID(),
          telegramId,
          username,
          tier,
          baseAmount: course.priceUsdt,
          amount,
          amountKey,
          wallet: this.wallet,
          status: 'pending',
          expiresAt: new Date(Date.now() + this.ttlMinutes * 60_000),
          delivered: false,
        });
        return created.toObject();
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
        taken.add(amountKey);
      }
    }

    throw new Error('Не удалось подобрать свободную сумму — попробуйте позже');
  }

  findActiveOrder(telegramId: number, tier?: CourseTier): Promise<Order | null> {
    return this.orderModel
      .findOne({
        telegramId,
        ...(tier ? { tier } : {}),
        status: 'pending',
        expiresAt: { $gt: new Date() },
      })
      .lean<Order>()
      .exec();
  }

  findByOrderId(orderId: string): Promise<Order | null> {
    return this.orderModel.findOne({ orderId }).lean<Order>().exec();
  }

  async cancelOrder(orderId: string, telegramId: number): Promise<Order | null> {
    return this.orderModel
      .findOneAndUpdate(
        { orderId, telegramId, status: 'pending' },
        { $set: { status: 'cancelled' } },
        { new: true },
      )
      .lean<Order>()
      .exec();
  }

  /** Просроченные заказы освобождают свою сумму — иначе хвосты кончатся. */
  async expireStale(now = new Date()): Promise<number> {
    const res = await this.orderModel
      .updateMany({ status: 'pending', expiresAt: { $lte: now } }, { $set: { status: 'expired' } })
      .exec();
    return res.modifiedCount ?? 0;
  }

  /**
   * Сопоставляет пришедшие переводы с ожидающими заказами. Возвращает заказы,
   * которые этим тиком закрылись.
   *
   * Поиск и перевод в `paid` — одной атомарной операцией: два тика воркера
   * могут пересечься (сеть тормозит, интервал не ждёт), и без этого один платёж
   * закрыл бы заказ дважды и выдал материалы дважды.
   */
  async settle(transfers: readonly Trc20Transfer[]): Promise<Order[]> {
    const paid: Order[] = [];

    for (const transfer of transfers) {
      const order = await this.orderModel
        .findOneAndUpdate(
          {
            amountKey: transfer.amountKey,
            status: 'pending',
            expiresAt: { $gt: new Date() },
          },
          {
            $set: { status: 'paid', paidAt: new Date(transfer.timestamp), txId: transfer.txId },
          },
          { new: true, sort: { createdAt: 1 } },
        )
        .lean<Order>()
        .exec();

      if (!order) continue;

      this.logger.log(
        `Заказ ${order.orderId} (${order.tier}) оплачен: ${transfer.amountKey} USDT, tx ${transfer.txId}`,
      );
      paid.push(order);
    }

    for (const order of paid) await this.emitPaid(order);

    return paid;
  }

  async markDelivered(orderId: string): Promise<void> {
    await this.orderModel.updateOne({ orderId }, { $set: { delivered: true } }).exec();
  }

  /**
   * Оплаченные, но ещё не выданные заказы. Нужны на старте: если процесс упал
   * между «платёж принят» и «файл отправлен», материалы всё равно уедут.
   */
  findUndelivered(): Promise<Order[]> {
    return this.orderModel.find({ status: 'paid', delivered: false }).lean<Order[]>().exec();
  }

  private async pendingAmountKeys(): Promise<Set<string>> {
    const rows = await this.orderModel
      .find({ status: 'pending' }, { amountKey: 1 })
      .lean<Array<{ amountKey: string }>>()
      .exec();
    return new Set(rows.map((row) => row.amountKey));
  }

  private async emitPaid(order: Order): Promise<void> {
    for (const handler of this.paidHandlers) {
      try {
        await handler(order);
      } catch (error) {
        this.logger.error(`Обработчик оплаты упал на заказе ${order.orderId}`, error as Error);
      }
    }
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}
