import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Telegraf, Markup } from 'telegraf';
import { CoursesService } from '../courses/courses.service';
import { CourseTier } from '../courses/course.schema';

const TIER_LABELS: Record<CourseTier, string> = {
  basic: 'Базовий',
  medium: 'Середній',
  advanced: 'Просунутий',
};

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf;
  botUsername = '';

  constructor(private readonly coursesService: CoursesService) {}

  async onModuleInit() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set, bot disabled');
      return;
    }

    this.bot = new Telegraf(token);

    this.bot.start(async (ctx) => {
      const courses = await this.coursesService.findAllActive();
      const buttons = courses.map((c) =>
        Markup.button.callback(TIER_LABELS[c.tier as CourseTier] ?? c.title, `tier:${c.tier}`),
      );
      await ctx.reply(
        'Оберіть курс, який вас цікавить:',
        Markup.inlineKeyboard(buttons, { columns: 1 }),
      );
    });

    this.bot.action(/^tier:(basic|medium|advanced)$/, async (ctx) => {
      const tier = ctx.match[1] as CourseTier;
      const course = await this.coursesService.findByTier(tier);
      await ctx.answerCbQuery();

      if (!course || !course.active) {
        await ctx.reply('Цей курс наразі недоступний.');
        return;
      }

      await ctx.reply(
        `${course.title}\n\n${course.description}\n\nВартість: ${course.price} ${course.currency}`,
      );
    });

    const me = await this.bot.telegram.getMe();
    this.botUsername = me.username;

    // bot.launch() awaits the long-polling loop itself and never resolves —
    // it must run in the background, not block Nest's startup.
    this.bot.launch().catch((err) => this.logger.error('Telegram bot crashed', err));
    this.logger.log(`Telegram bot @${this.botUsername} launched`);
  }

  onModuleDestroy() {
    this.bot?.stop('shutdown');
  }
}
