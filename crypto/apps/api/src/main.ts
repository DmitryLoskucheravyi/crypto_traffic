import 'reflect-metadata';
import { existsSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadConfig } from './config/app-config';

// Точка сборки (composition root): единственное место, которое читает
// окружение. Всё остальное получает готовый конфиг через DI.
async function bootstrap() {
  // В dev .env лежит в корне crypto/. В контейнере его нет — переменные
  // приходят из env_file docker-compose. Уже заданные переменные файл не
  // перетирает.
  const envFile = join(__dirname, '../../../.env');
  if (existsSync(envFile)) process.loadEnvFile(envFile);

  const config = loadConfig(process.env);

  const app = await NestFactory.create(AppModule.forRoot(config));
  app.setGlobalPrefix('api');
  // Лендинг статический и в API не ходит, браузерных клиентов у сервиса нет —
  // CORS включать нечему.
  app.enableShutdownHooks();
  await app.listen(config.port, '0.0.0.0');
}

void bootstrap();
