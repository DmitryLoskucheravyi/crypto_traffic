import { Module } from '@nestjs/common';
import { PostingService } from './posting.service';
import { StateModule } from '../state/state.module';
import { GenerationModule } from '../generation/generation.module';

@Module({
  imports: [StateModule, GenerationModule],
  providers: [PostingService],
  exports: [PostingService],
})
export class PostingModule {}
