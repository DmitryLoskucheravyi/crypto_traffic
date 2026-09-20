import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { AdminController } from './admin.controller';
import { StateModule } from '../state/state.module';
import { PostingModule } from '../posting/posting.module';

@Module({
  imports: [StateModule, PostingModule],
  controllers: [AuthController, AdminController],
  providers: [AuthService, AuthGuard],
})
export class AdminModule {}
