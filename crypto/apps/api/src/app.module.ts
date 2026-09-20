import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesModule } from './courses/courses.module';
import { AdminModule } from './admin/admin.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: join(__dirname, '../../../.env') }),
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    CoursesModule,
    AdminModule,
    TelegramModule,
  ],
})
export class AppModule {}
