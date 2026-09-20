import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { assertWebhookConfig } from './config/env.validation';

async function bootstrap() {
  assertWebhookConfig(process.env);

  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.enableCors();

  const logger = new Logger('Bootstrap');
  const config = app.get(ConfigService);
  const botPort = config.getOrThrow<number>('botPort');

  await app.listen(botPort, '0.0.0.0');

  logger.log(`Admin API доступне на порту ${botPort}`);
  logger.log(`Бот запущено в режимі "${config.get<string>('botMode')}"`);
}

bootstrap();
