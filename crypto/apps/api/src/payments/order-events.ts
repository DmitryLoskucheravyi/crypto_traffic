import { Injectable, Logger } from '@nestjs/common';
import type { Order } from './domain/order';

export type PaidHandler = (order: Order) => void | Promise<void>;

/**
 * «Заказ оплачен» как событие. Платежи не знают, кто и как выдаёт материалы,
 * а бот не знает, откуда пришла оплата: обе стороны зависят только от этой
 * шины, и модулям не нужно импортировать друг друга по кругу.
 */
@Injectable()
export class OrderEvents {
  private readonly logger = new Logger(OrderEvents.name);
  private readonly paidHandlers: PaidHandler[] = [];

  onPaid(handler: PaidHandler): void {
    this.paidHandlers.push(handler);
  }

  /** Падение одного подписчика не мешает остальным и не роняет платёж. */
  async emitPaid(order: Order): Promise<void> {
    for (const handler of this.paidHandlers) {
      try {
        await handler(order);
      } catch (error) {
        this.logger.error(`Обработчик оплаты упал на заказе ${order.orderId}`, error as Error);
      }
    }
  }
}
