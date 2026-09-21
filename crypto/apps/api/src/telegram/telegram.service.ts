import { createReadStream } from 'fs';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Markup, Telegraf } from 'telegraf';
import { CATALOG, findCourse, isTier, type Course } from '../catalog/catalog';
import { PaymentsService, WalletNotConfiguredError } from '../payments/payments.service';
import type { Order } from '../payments/order.schema';
import { resolveMaterial } from './materials';
import * as texts from './texts';

const HTML = { parse_mode: 'HTML' } as const;

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot?: Telegraf;
  botUsername = '';

  constructor(private readonly payments: PaymentsService) {}

  async onModuleInit(): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN не задан — бот выключен');
      return;
    }

    const bot = new Telegraf(token);
    this.bot = bot;

    this.registerHandlers(bot);

    // Слушатель кошелька закрывает заказ в фоне, а сообщить об этом должен бот —
    // отсюда подписка, а не прямой вызов из PaymentsService.
    this.payments.onPaid((order) => this.deliver(order));

    const me = await bot.telegram.getMe();
    this.botUsername = me.username;

    // bot.launch() сам ждёт цикл long-polling и никогда не резолвится — его
    // нельзя await-ить, иначе Nest не закончит старт.
    void bot.launch().catch((error) => this.logger.error('Бот упал', error));
    this.logger.log(`Бот @${this.botUsername} запущен`);

    // Процесс мог упасть между «платёж принят» и «файл отправлен».
    await this.flushUndelivered();
  }

  onModuleDestroy(): void {
    this.bot?.stop('shutdown');
  }

  private registerHandlers(bot: Telegraf): void {
    bot.start(async (ctx) => {
      await ctx.reply(texts.greeting(), { ...HTML, ...courseKeyboard() });
    });

    bot.command('courses', async (ctx) => {
      await ctx.reply(texts.greeting(), { ...HTML, ...courseKeyboard() });
    });

    bot.action('menu', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.reply(texts.greeting(), { ...HTML, ...courseKeyboard() });
    });

    bot.action(/^tier:(.+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const course = courseFrom(ctx.match[1]);
      if (!course) {
        await ctx.reply(texts.unknownCourseNotice());
        return;
      }

      await ctx.reply(texts.courseCard(course), {
        ...HTML,
        ...Markup.inlineKeyboard([
          [Markup.button.callback(`Оплатить ${course.priceUsdt} USDT`, `pay:${course.tier}`)],
          [Markup.button.callback('← К списку курсов', 'menu')],
        ]),
      });
    });

    bot.action(/^pay:(.+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const course = courseFrom(ctx.match[1]);
      if (!course) {
        await ctx.reply(texts.unknownCourseNotice());
        return;
      }

      const from = ctx.from;
      if (!from) return;

      try {
        const order = await this.payments.createOrder(from.id, course.tier, from.username);
        await ctx.reply(texts.invoice(course, order), {
          ...HTML,
          ...Markup.inlineKeyboard([
            [Markup.button.callback('Я оплатил — проверить', `check:${order.orderId}`)],
            [Markup.button.callback('Отменить заказ', `cancel:${order.orderId}`)],
          ]),
        });
      } catch (error) {
        if (error instanceof WalletNotConfiguredError) {
          await ctx.reply(texts.walletMissingNotice());
          return;
        }
        this.logger.error('Не удалось создать заказ', error as Error);
        await ctx.reply('Не получилось выставить счёт. Попробуйте ещё раз через минуту.');
      }
    });

    // Кнопка «я оплатил» ничего не запрашивает в сети: слушатель всё равно
    // закроет заказ сам. Она существует, чтобы человеку было куда нажать и
    // чтобы он увидел, что его платёж ещё в пути.
    bot.action(/^check:(.+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const order = await this.payments.findByOrderId(ctx.match[1]);
      if (!order) {
        await ctx.reply(texts.expiredNotice());
        return;
      }

      const course = findCourse(order.tier);
      if (order.status === 'paid' && course) {
        await this.deliver(order);
        return;
      }
      if (order.status === 'expired' || order.expiresAt.getTime() <= Date.now()) {
        await ctx.reply(texts.expiredNotice());
        return;
      }
      if (order.status === 'cancelled') {
        await ctx.reply(texts.cancelledNotice());
        return;
      }

      await ctx.reply(texts.pendingNotice(order), HTML);
    });

    bot.action(/^cancel:(.+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const from = ctx.from;
      if (!from) return;

      const cancelled = await this.payments.cancelOrder(ctx.match[1], from.id);
      await ctx.reply(cancelled ? texts.cancelledNotice() : texts.expiredNotice());
    });
  }

  /** Отправляет материалы и помечает заказ выданным. Идемпотентна по `delivered`. */
  private async deliver(order: Order): Promise<void> {
    const bot = this.bot;
    const course = findCourse(order.tier);
    if (!bot || !course) return;
    if (order.delivered) return;

    try {
      await bot.telegram.sendMessage(order.telegramId, texts.paidNotice(course, order), HTML);
      await this.sendMaterial(order, course);
      await this.payments.markDelivered(order.orderId);
    } catch (error) {
      // Не помечаем выданным: следующий запуск (или кнопка «проверить»)
      // попробует ещё раз.
      this.logger.error(`Не удалось выдать материалы по заказу ${order.orderId}`, error as Error);
    }
  }

  private async sendMaterial(order: Order, course: Course): Promise<void> {
    const bot = this.bot;
    if (!bot) return;

    const material = resolveMaterial(order.tier);
    if (!material) {
      this.logger.warn(`Материалы для уровня ${order.tier} не настроены`);
      await bot.telegram.sendMessage(order.telegramId, texts.materialsFallback(course), HTML);
      return;
    }

    const document =
      material.kind === 'path'
        ? { source: createReadStream(material.value), filename: material.filename }
        : material.kind === 'url'
          ? { url: material.value, filename: material.filename }
          : material.value;

    await bot.telegram.sendDocument(order.telegramId, document, { caption: course.title });
  }

  private async flushUndelivered(): Promise<void> {
    const pending = await this.payments.findUndelivered();
    if (!pending.length) return;

    this.logger.log(`Догоняю выдачу по ${pending.length} оплаченным заказам`);
    for (const order of pending) await this.deliver(order);
  }
}

function courseFrom(value: string): Course | undefined {
  return isTier(value) ? findCourse(value) : undefined;
}

function courseKeyboard() {
  return Markup.inlineKeyboard(
    CATALOG.map((course) => [Markup.button.callback(course.buttonLabel, `tier:${course.tier}`)]),
  );
}
