import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // Лендинг статический и в API не ходит, браузерных клиентов у сервиса нет —
  // CORS включать нечему.
  app.enableShutdownHooks();
  const port = process.env.PORT ?? 3031;
  await app.listen(port as number, '0.0.0.0');
}

void bootstrap();
