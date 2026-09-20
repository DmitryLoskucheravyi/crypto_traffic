import { BadRequestException, Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { StateService } from '../state/state.service';
import { PostingService } from '../posting/posting.service';
import { PrismaService } from '../prisma/prisma.service';
import { isMode } from '../common/types/mode';

const DEFAULT_HISTORY_LIMIT = 20;
const MAX_HISTORY_LIMIT = 100;

@Controller('api')
@UseGuards(AuthGuard)
export class AdminController {
  constructor(
    private readonly stateService: StateService,
    private readonly postingService: PostingService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('status')
  getStatus() {
    return this.stateService.getState();
  }

  @Post('mode')
  setMode(@Body() body: { mode?: string }) {
    const mode = body?.mode;
    if (!mode || !isMode(mode)) {
      throw new BadRequestException('mode має бути один з: off, approve, auto');
    }
    return this.stateService.setMode(mode);
  }

  @Post('post-now')
  postNow() {
    return this.postingService.runCycle('manual');
  }

  @Post('draft/publish')
  publishDraft() {
    return this.postingService.publishPendingDraft();
  }

  @Post('draft/regenerate')
  regenerateDraft() {
    return this.postingService.regenerateDraft();
  }

  @Post('draft/reject')
  rejectDraft() {
    return this.postingService.rejectDraft();
  }

  @Get('history')
  getHistory(@Query('limit') limit?: string) {
    const parsed = parseInt(limit ?? '', 10);
    const take = Math.min(Math.max(Number.isFinite(parsed) ? parsed : DEFAULT_HISTORY_LIMIT, 1), MAX_HISTORY_LIMIT);
    return this.prisma.postHistory.findMany({ orderBy: { createdAt: 'desc' }, take });
  }
}
