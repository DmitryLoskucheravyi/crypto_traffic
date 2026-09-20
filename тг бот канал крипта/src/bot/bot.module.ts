import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';

// Бот тут використовується лише для публікації в канал і сповіщень власнику.
// Керування (режими, апрув чернетки, /post_now) — через веб-панель (див. AdminModule).
@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const botMode = config.get<'polling' | 'webhook'>('botMode');

        if (botMode === 'webhook') {
          return {
            token: config.getOrThrow<string>('botToken'),
            launchOptions: {
              webhook: {
                domain: config.getOrThrow<string>('webhookUrl'),
                path: config.getOrThrow<string>('webhookPath'),
                port: config.getOrThrow<number>('telegramWebhookPort'),
              },
            },
          };
        }

        return {
          token: config.getOrThrow<string>('botToken'),
          launchOptions: {
            dropPendingUpdates: true,
          },
        };
      },
    }),
  ],
})
export class BotModule {}
