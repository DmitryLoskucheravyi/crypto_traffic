import { createReadStream } from 'fs';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Telegraf } from 'telegraf';
import { findCourse, type Course } from '../catalog/catalog';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import type { Order } from '../payments/domain/order';
import { OrderEvents } from '../payments/order-events';
import { PaymentsService } from '../payments/payments.service';
import { resolveMaterial } from './materials';
import { TELEGRAF } from './telegraf.provider';
import * as texts from './texts';

const HTML = { parse_mode: 'HTML' } as const;

export type DeliveryResult = 'sent' | 'already-delivered' | 'busy' | 'failed';

/**
 * Выдача оплаченного курса в чат. Единственный класс, который знает, как
 * материалы уходят покупателю; вызывают его и слушатель платежей (через
 * OrderEvents), и кнопка «Я оплатил», и догон на старте.
 */
@Injectable()
export class DeliveryService implements OnModuleInit {
  private readonly logger = new Logger(DeliveryService.name);
  /** Заказы, по которым выдача идёт прямо сейчас: кнопка и слушатель не должны слать файл дважды. */
  private readonly inFlight = new Set<string>();

  constructor(
    @Inject(TELEGRAF) private readonly bot: Telegraf | null,
    private readonly payments: PaymentsService,
    private readonly events: OrderEvents,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  onModuleInit(): void {
    this.events.onPaid(async (order) => {
      await this.deliver(order.orderId);
    });
  }

  /**
   * Отправляет материалы и помечает заказ выданным. Заказ перечитывается из
   * базы: копия, пришедшая от слушателя или кнопки, могла устареть, пока шла
   * параллельная выдача.
   */
  async deliver(orderId: string): Promise<DeliveryResult> {
    if (!this.bot) return 'failed';
    if (this.inFlight.has(orderId)) return 'busy';
    this.inFlight.add(orderId);

    try {
      const order = await this.payments.findOrder(orderId);
      const course = order ? findCourse(order.tier) : undefined;
      if (!order || !course || order.status !== 'paid') return 'failed';
      if (order.delivered) return 'already-delivered';

      if (!order.notified) {
        await this.bot.telegram.sendMessage(
          order.telegramId,
          texts.paidNotice(course, order),
          HTML,
        );
        await this.payments.markNotified(orderId);
      }
      await this.sendMaterial(order, course);
      await this.payments.markDelivered(orderId);
      return 'sent';
    } catch (error) {
      // Не помечаем выданным: следующий запуск (или кнопка «проверить»)
      // попробует ещё раз.
      this.logger.error(`Не удалось выдать материалы по заказу ${orderId}`, error as Error);
      return 'failed';
    } finally {
      this.inFlight.delete(orderId);
    }
  }

  /** Процесс мог упасть между «платёж принят» и «файл отправлен». */
  async flushUndelivered(): Promise<void> {
    const pending = await this.payments.findUndelivered();
    if (!pending.length) return;

    this.logger.log(`Догоняю выдачу по ${pending.length} оплаченным заказам`);
    for (const order of pending) await this.deliver(order.orderId);
  }

  private async sendMaterial(order: Order, course: Course): Promise<void> {
    const telegram = this.bot!.telegram;
    const material = resolveMaterial(this.config.materials[order.tier]);

    if (!material) {
      this.logger.warn(`Материалы для уровня ${order.tier} не настроены`);
      await telegram.sendMessage(order.telegramId, texts.materialsFallback(course), HTML);
      return;
    }

    const document =
      material.kind === 'path'
        ? { source: createReadStream(material.value), filename: material.filename }
        : material.kind === 'url'
          ? { url: material.value, filename: material.filename }
          : material.value;

    await telegram.sendDocument(order.telegramId, document, { caption: course.title });
  }
}
