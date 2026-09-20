import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { State } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StateService } from '../state/state.service';
import { GenerationService } from '../generation/generation.service';
import { Trigger } from '../common/types/mode';

@Injectable()
export class PostingService {
  private readonly logger = new Logger(PostingService.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly stateService: StateService,
    private readonly generationService: GenerationService,
  ) {}

  async publishToChannel(text: string): Promise<void> {
    const channelId = this.config.getOrThrow<string>('channelId');
    await this.bot.telegram.sendMessage(channelId, text);
  }

  async notifyOwnerDraft(): Promise<void> {
    const ownerId = this.config.getOrThrow<string>('ownerId');
    const panelUrl = this.config.get<string>('panelUrl');
    const link = panelUrl ? `\n${panelUrl}` : '';
    await this.bot.telegram
      .sendMessage(ownerId, `📝 Нова чернетка готова на розгляд у веб-панелі.${link}`)
      .catch((err) => this.logger.error(`Не вдалося сповістити власника: ${err}`));
  }

  async notifyOwnerError(context: string, error: unknown): Promise<void> {
    const ownerId = this.config.getOrThrow<string>('ownerId');
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`${context}: ${message}`);
    await this.bot.telegram
      .sendMessage(ownerId, `⚠️ Помилка (${context}): ${message}`)
      .catch((err) => this.logger.error(`Не вдалося сповістити власника: ${err}`));
  }

  /**
   * Єдина точка запуску генерації допису — використовується і щоденним cron-джобом,
   * і кнопкою "Запустити зараз" у веб-панелі. Ручний запуск НЕ зсуває розклад щоденного тригера.
   */
  async runCycle(trigger: Trigger): Promise<State> {
    const state = await this.stateService.getState();

    if (state.mode === 'off' && trigger === 'scheduled') {
      this.logger.log('Режим off — плановий запуск пропущено');
      await this.advanceSchedule(state.dailyHour, state.dailyMinute);
      return this.stateService.getState();
    }

    // Ручний запуск у режимі off: власник явно попросив пост — трактуємо як approve,
    // щоб текст все одно пройшов підтвердження в панелі, а не публікувався сам.
    const effectiveMode = state.mode === 'off' ? 'approve' : state.mode;

    let text: string;
    try {
      text = await this.generationService.generatePost();
    } catch (error) {
      await this.notifyOwnerError('генерація допису', error);
      await this.prisma.postHistory.create({
        data: {
          content: '',
          trigger,
          mode: state.mode,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        },
      });
      if (trigger === 'scheduled') {
        await this.advanceSchedule(state.dailyHour, state.dailyMinute);
      }
      return this.stateService.getState();
    }

    try {
      if (effectiveMode === 'auto') {
        await this.publishToChannel(text);
        await this.prisma.postHistory.create({
          data: { content: text, trigger, mode: state.mode, status: 'published' },
        });
      } else {
        await this.stateService.setPendingDraft(text);
        await this.notifyOwnerDraft();
        await this.prisma.postHistory.create({
          data: { content: text, trigger, mode: state.mode, status: 'pending' },
        });
      }
    } catch (error) {
      await this.notifyOwnerError('публікація/надсилання чернетки', error);
      await this.prisma.postHistory.create({
        data: {
          content: text,
          trigger,
          mode: state.mode,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    if (trigger === 'scheduled') {
      await this.stateService.setLastRunAt(new Date());
      await this.advanceSchedule(state.dailyHour, state.dailyMinute);
    }

    return this.stateService.getState();
  }

  async publishPendingDraft(): Promise<State> {
    const state = await this.stateService.getState();
    if (!state.pendingDraft) {
      throw new BadRequestException('Немає чернетки для публікації');
    }

    await this.publishToChannel(state.pendingDraft);
    await this.prisma.postHistory.create({
      data: { content: state.pendingDraft, trigger: 'manual', mode: state.mode, status: 'published' },
    });
    return this.stateService.setPendingDraft(null);
  }

  async regenerateDraft(): Promise<State> {
    const text = await this.generationService.generatePost();
    return this.stateService.setPendingDraft(text);
  }

  async rejectDraft(): Promise<State> {
    const state = await this.stateService.getState();
    if (state.pendingDraft) {
      await this.prisma.postHistory.create({
        data: { content: state.pendingDraft, trigger: 'manual', mode: state.mode, status: 'rejected' },
      });
    }
    return this.stateService.setPendingDraft(null);
  }

  private async advanceSchedule(hour: number, minute: number): Promise<void> {
    const next = this.stateService.computeNextRunAt(hour, minute);
    await this.stateService.setNextRunAt(next);
  }
}
