import type { CourseTier } from '../catalog/catalog';
import { isAwaitingPayment, isPayableBy, type Order } from '../payments/domain/order';
import type { Trc20Transfer } from '../payments/domain/transfer';
import { DuplicateAmountError, OrderRepository } from '../payments/order.repository';

/**
 * Хранилище заказов в памяти. Правила выбора — те же чистые функции домена,
 * что описывают запросы MongoOrderRepository, поэтому тесты сервиса проверяют
 * бизнес-логику, а не эмуляцию синтаксиса Mongo.
 */
export class InMemoryOrderRepository extends OrderRepository {
  readonly orders: Order[] = [];

  async insert(order: Order): Promise<Order> {
    if (this.orders.some((o) => o.status === 'pending' && o.amountKey === order.amountKey)) {
      throw new DuplicateAmountError(order.amountKey);
    }
    this.orders.push({ ...order });
    return { ...order };
  }

  async findById(orderId: string): Promise<Order | null> {
    return copy(this.orders.find((o) => o.orderId === orderId));
  }

  async findAwaiting(telegramId: number, tier: CourseTier, now: Date): Promise<Order | null> {
    return copy(
      this.orders.find(
        (o) => o.telegramId === telegramId && o.tier === tier && isAwaitingPayment(o, now),
      ),
    );
  }

  async pendingAmountKeys(): Promise<Set<string>> {
    return new Set(this.orders.filter((o) => o.status === 'pending').map((o) => o.amountKey));
  }

  async cancel(orderId: string, telegramId: number): Promise<Order | null> {
    const order = this.orders.find(
      (o) => o.orderId === orderId && o.telegramId === telegramId && o.status === 'pending',
    );
    if (!order) return null;
    order.status = 'cancelled';
    return { ...order };
  }

  async expire(now: Date): Promise<number> {
    const stale = this.orders.filter((o) => o.status === 'pending' && o.expiresAt <= now);
    stale.forEach((o) => (o.status = 'expired'));
    return stale.length;
  }

  async isTxUsed(txId: string): Promise<boolean> {
    return this.orders.some((o) => o.txId === txId);
  }

  async claimPaid(transfer: Trc20Transfer): Promise<Order | null> {
    const order = this.orders
      .filter((o) => isPayableBy(o, transfer))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    if (!order) return null;
    Object.assign(order, {
      status: 'paid',
      paidAt: new Date(transfer.timestamp),
      txId: transfer.txId,
    });
    return { ...order };
  }

  async markNotified(orderId: string): Promise<void> {
    this.update(orderId, { notified: true });
  }

  async markDelivered(orderId: string): Promise<void> {
    this.update(orderId, { delivered: true });
  }

  async findUndelivered(): Promise<Order[]> {
    return this.orders.filter((o) => o.status === 'paid' && !o.delivered).map((o) => ({ ...o }));
  }

  private update(orderId: string, patch: Partial<Order>): void {
    const order = this.orders.find((o) => o.orderId === orderId);
    if (order) Object.assign(order, patch);
  }
}

function copy(order: Order | undefined): Order | null {
  return order ? { ...order } : null;
}
