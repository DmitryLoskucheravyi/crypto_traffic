import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { State } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Mode } from '../common/types/mode';

const STATE_ID = 1;

@Injectable()
export class StateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getState(): Promise<State> {
    const existing = await this.prisma.state.findUnique({ where: { id: STATE_ID } });
    if (existing) {
      return existing;
    }

    return this.prisma.state.create({
      data: {
        id: STATE_ID,
        mode: 'off',
        dailyHour: this.config.get<number>('dailyHour'),
        dailyMinute: this.config.get<number>('dailyMinute'),
      },
    });
  }

  async setMode(mode: Mode): Promise<State> {
    await this.getState();
    return this.prisma.state.update({ where: { id: STATE_ID }, data: { mode } });
  }

  async setPendingDraft(text: string | null): Promise<State> {
    await this.getState();
    return this.prisma.state.update({ where: { id: STATE_ID }, data: { pendingDraft: text } });
  }

  async setLastRunAt(date: Date): Promise<State> {
    await this.getState();
    return this.prisma.state.update({ where: { id: STATE_ID }, data: { lastRunAt: date } });
  }

  async setNextRunAt(date: Date): Promise<State> {
    await this.getState();
    return this.prisma.state.update({ where: { id: STATE_ID }, data: { nextRunAt: date } });
  }

  computeNextRunAt(hour: number, minute: number, from: Date = new Date()): Date {
    const next = new Date(from);
    next.setHours(hour, minute, 0, 0);
    if (next <= from) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }
}
