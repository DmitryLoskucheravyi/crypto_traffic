import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { StateModule } from '../state/state.module';
import { PostingModule } from '../posting/posting.module';

@Module({
  imports: [ScheduleModule.forRoot(), StateModule, PostingModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
