import type { Provider } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { APP_CONFIG, type AppConfig } from '../config/app-config';

/** DI-токен экземпляра бота. Значение null — токен не задан, бот выключен. */
export const TELEGRAF = Symbol('TELEGRAF');

/**
 * Единственное место, где создаётся Telegraf. Остальные классы получают
 * готовый экземпляр через конструктор и сами его не строят.
 */
export const telegrafProvider: Provider = {
  provide: TELEGRAF,
  inject: [APP_CONFIG],
  useFactory: (config: AppConfig): Telegraf | null =>
    config.telegramToken ? new Telegraf(config.telegramToken) : null,
};
