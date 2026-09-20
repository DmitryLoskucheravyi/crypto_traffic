import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { StateService } from '../state/state.service';
import { PostingService } from '../posting/posting.service';

const DAILY_JOB_NAME = 'daily-post';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly stateService: StateService,
    private readonly postingService: PostingService,
  ) {}

  async onModuleInit(): Promise<void> {
    const state = await this.stateService.getState();
    this.registerDailyJob(state.dailyHour, state.dailyMinute);

    if (!state.nextRunAt) {
      const next = this.stateService.computeNextRunAt(state.dailyHour, state.dailyMinute);
      await this.stateService.setNextRunAt(next);
    }
  }

  private registerDailyJob(hour: number, minute: number): void {
    const cronExpression = `${minute} ${hour} * * *`;
    const job = new CronJob(cronExpression, () => this.handleDailyTrigger());

    this.schedulerRegistry.addCronJob(DAILY_JOB_NAME, job);
    job.start();

    this.logger.log(`Щоденний job зареєстровано на ${hour}:${String(minute).padStart(2, '0')} (cron: ${cronExpression})`);
  }

  private async handleDailyTrigger(): Promise<void> {
    this.logger.log('Спрацював щоденний тригер');
    await this.postingService.runCycle('scheduled');
  }
}
