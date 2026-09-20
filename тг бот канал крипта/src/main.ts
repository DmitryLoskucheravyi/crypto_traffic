import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { assertWebhookConfig } from './config/env.validation';

async function bootstrap() {
  assertWebhookConfig(process.env);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();
  app.use(cookieParser());
  app.useStaticAssets(join(__dirname, '..', 'public'));

  const logger = new Logger('Bootstrap');
  const config = app.get(ConfigService);
  const panelPort = config.getOrThrow<number>('panelPort');

  await app.listen(panelPort);

  logger.log(`Веб-панель доступна на порту ${panelPort}`);
  logger.log(`Бот запущено в режимі "${config.get<string>('botMode')}"`);
}

bootstrap();
