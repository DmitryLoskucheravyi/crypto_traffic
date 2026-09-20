import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { StateModule } from './state/state.module';
import { GenerationModule } from './generation/generation.module';
import { PostingModule } from './posting/posting.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { BotModule } from './bot/bot.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    StateModule,
    GenerationModule,
    PostingModule,
    SchedulerModule,
    BotModule,
    AdminModule,
  ],
})
export class AppModule {}
