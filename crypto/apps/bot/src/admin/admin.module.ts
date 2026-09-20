import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { StateModule } from '../state/state.module';
import { PostingModule } from '../posting/posting.module';

@Module({
  imports: [
    StateModule,
    PostingModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [AdminController],
  providers: [JwtAuthGuard],
})
export class AdminModule {}
