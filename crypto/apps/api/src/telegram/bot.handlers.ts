import { Injectable, Logger } from '@nestjs/common';
import type { Context, Telegraf } from 'telegraf';
import { findCourse, isTier, type Course } from '../catalog/catalog';
import { PaymentsService, WalletNotConfiguredError } from '../payments/payments.service';
import { DeliveryService } from './delivery.service';
import { CALLBACK, catalogKeyboard, courseKeyboard, invoiceKeyboard } from './keyboards';
import * as texts from './texts';

const HTML = { parse_mode: 'HTML' } as const;

/**
 * Маршрутизация апдейтов: команда или кнопка → сценарий → ответ. Роль
 * контроллера: разобрать вход, вызвать PaymentsService / DeliveryService,
 * выбрать текст. Ни хранения, ни правил оплаты здесь нет.
 */
@Injectable()
export class BotHandlers {
  private readonly logger = new Logger(BotHandlers.name);

  constructor(
    private readonly payments: PaymentsService,
    private readonly delivery: DeliveryService,
  ) {}

  register(bot: Telegraf): void {
    bot.start((ctx) => this.showCatalog(ctx));
    bot.command('courses', (ctx) => this.showCatalog(ctx));

    bot.action(CALLBACK.menu, async (ctx) => {
      await ack(ctx);
      await this.showCatalog(ctx);
    });

    bot.action(CALLBACK.tier, async (ctx) => {
      await ack(ctx);
      const course = courseFrom(ctx.match[1]);
      if (!course) return void (await ctx.reply(texts.unknownCourseNotice()));

      await ctx.reply(texts.courseCard(course), { ...HTML, ...courseKeyboard(course) });
    });

    bot.action(CALLBACK.pay, async (ctx) => {
      await ack(ctx);
      const course = courseFrom(ctx.match[1]);
      if (!course) return void (await ctx.reply(texts.unknownCourseNotice()));
      if (!ctx.from) return;

      await this.issueInvoice(ctx, course, ctx.from.id, ctx.from.username);
    });

    // Кнопка «я оплатил» ничего не запрашивает в сети: слушатель всё равно
    // закроет заказ сам. Она существует, чтобы человеку было куда нажать, и
    // заодно дожимает выдачу, если автоматическая не удалась.
    bot.action(CALLBACK.check, async (ctx) => {
      await ack(ctx);
      await this.checkOrder(ctx, ctx.match[1]);
    });

    bot.action(CALLBACK.cancel, async (ctx) => {
      await ack(ctx);
      if (!ctx.from) return;

      const cancelled = await this.payments.cancelOrder(ctx.match[1], ctx.from.id);
      await ctx.reply(cancelled ? texts.cancelledNotice() : texts.expiredNotice());
    });
  }

  private async showCatalog(ctx: Context): Promise<void> {
    await ctx.reply(texts.greeting(), { ...HTML, ...catalogKeyboard() });
  }

  private async issueInvoice(
    ctx: Context,
    course: Course,
    telegramId: number,
    username?: string,
  ): Promise<void> {
    try {
      const order = await this.payments.createOrder(telegramId, course.tier, username);
      await ctx.reply(texts.invoice(course, order, new Date()), {
        ...HTML,
        ...invoiceKeyboard(order),
      });
    } catch (error) {
      if (error instanceof WalletNotConfiguredError) {
        await ctx.reply(texts.walletMissingNotice());
        return;
      }
      this.logger.error('Не удалось создать заказ', error as Error);
      await ctx.reply(texts.invoiceFailedNotice());
    }
  }

  private async checkOrder(ctx: Context, orderId: string): Promise<void> {
    const order = await this.payments.findOrder(orderId);
    if (!order) return void (await ctx.reply(texts.expiredNotice()));

    switch (order.status) {
      case 'paid': {
        const result = await this.delivery.deliver(order.orderId);
        if (result === 'already-delivered') await ctx.reply(texts.alreadyDeliveredNotice());
        else if (result !== 'sent') await ctx.reply(texts.deliveryRetryNotice());
        return;
      }
      case 'cancelled':
        return void (await ctx.reply(texts.cancelledNotice()));
      case 'expired':
        return void (await ctx.reply(texts.expiredNotice()));
      case 'pending':
        if (order.expiresAt.getTime() <= Date.now()) {
          return void (await ctx.reply(texts.expiredNotice()));
        }
        return void (await ctx.reply(texts.pendingNotice(order), HTML));
    }
  }
}

/**
 * Гасит «часики» на нажатой кнопке. На кнопку из старого сообщения Telegram
 * отвечает 400 «query is too old», и это не повод обрывать обработку нажатия.
 */
function ack(ctx: Context): Promise<unknown> {
  return ctx.answerCbQuery().catch(() => undefined);
}

function courseFrom(value: string): Course | undefined {
  return isTier(value) ? findCourse(value) : undefined;
}
