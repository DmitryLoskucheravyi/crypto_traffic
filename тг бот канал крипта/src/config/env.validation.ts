import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  BOT_TOKEN: Joi.string().required(),
  CHANNEL_ID: Joi.string().required(),
  OWNER_ID: Joi.string().required(),

  // Мережевий режим САМОГО telegram-бота (тільки публікація в канал + опційні алерти
  // власнику). Керування ботом іде через веб-панель, не через Telegram-команди.
  BOT_MODE: Joi.string().valid('polling', 'webhook').default('polling'),
  WEBHOOK_URL: Joi.string().uri().allow('').default(''),
  WEBHOOK_PATH: Joi.string().default('/telegram/webhook'),
  TELEGRAM_WEBHOOK_PORT: Joi.number().default(3001),

  OPENAI_API_KEY: Joi.string().required(),
  OPENAI_MODEL: Joi.string().default('gpt-4o-mini'),
  PROMPT_TEMPLATE: Joi.string().required(),

  DAILY_HOUR: Joi.number().min(0).max(23).default(9),
  DAILY_MINUTE: Joi.number().min(0).max(59).default(0),

  DATABASE_URL: Joi.string().required(),

  // Веб-панель адміністрування (повна заміна Telegram-команд)
  PANEL_PORT: Joi.number().default(3000),
  PANEL_URL: Joi.string().uri().allow('').default(''),
  ADMIN_USERNAME: Joi.string().required(),
  ADMIN_PASSWORD: Joi.string().min(8).required(),
  SESSION_SECRET: Joi.string().min(16).required(),
}).unknown(true);

// WEBHOOK_URL є обов'язковим лише при BOT_MODE=webhook — перевіряється окремо
// (не через Joi.when), щоб схема лишалась простою та явно перевіряти в bootstrap.
export function assertWebhookConfig(env: Record<string, string | undefined>) {
  if (env.BOT_MODE === 'webhook' && !env.WEBHOOK_URL) {
    throw new Error('WEBHOOK_URL обов\'язковий, якщо BOT_MODE=webhook');
  }
}
