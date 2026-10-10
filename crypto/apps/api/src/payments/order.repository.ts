import type { CourseTier } from '../catalog/catalog';
import type { Order } from './domain/order';
import type { Trc20Transfer } from './domain/transfer';

/** Сумма уже занята другим ожидающим заказом — гонка двух одновременных /pay. */
export class DuplicateAmountError extends Error {
  constructor(amountKey: string) {
    super(`Сумма ${amountKey} уже ждёт оплаты по другому заказу`);
    this.name = 'DuplicateAmountError';
  }
}

/**
 * Порт хранилища заказов. PaymentsService зависит от этой абстракции, а не от
 * Mongo: реализация для прода — MongoOrderRepository, для тестов —
 * InMemoryOrderRepository. Абстрактный класс, а не interface, потому что он
 * же служит DI-токеном в Nest.
 *
 * Контракт: правила выбора заказа совпадают с чистыми функциями из
 * domain/order.ts (isAwaitingPayment, isPayableBy).
 */
export abstract class OrderRepository {
  /** @throws DuplicateAmountError, если сумма уже занята ожидающим заказом. */
  abstract insert(order: Order): Promise<Order>;

  abstract findById(orderId: string): Promise<Order | null>;

  /** Ожидающий, не истёкший заказ человека на этот уровень. */
  abstract findAwaiting(telegramId: number, tier: CourseTier, now: Date): Promise<Order | null>;

  /** Ключи сумм всех заказов в статусе pending — занятые хвосты. */
  abstract pendingAmountKeys(): Promise<Set<string>>;

  /** pending → cancelled, только для владельца. */
  abstract cancel(orderId: string, telegramId: number): Promise<Order | null>;

  /** pending с истёкшим сроком → expired. Возвращает число заказов. */
  abstract expire(now: Date): Promise<number>;

  abstract isTxUsed(txId: string): Promise<boolean>;

  /**
   * Атомарно находит самый ранний заказ, который оплачивает перевод
   * (isPayableBy), и переводит его в paid. Атомарность обязательна: два
   * прохода слушателя могут пересечься, и один платёж не должен закрыть
   * заказ дважды.
   */
  abstract claimPaid(transfer: Trc20Transfer): Promise<Order | null>;

  abstract markNotified(orderId: string): Promise<void>;

  abstract markDelivered(orderId: string): Promise<void>;

  /** Оплаченные, но ещё не выданные. */
  abstract findUndelivered(): Promise<Order[]>;
}
