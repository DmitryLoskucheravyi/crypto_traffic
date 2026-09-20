import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  CHANNEL_BOT_TOKEN: Joi.string().required(),
  CHANNEL_ID: Joi.string().required(),
  OWNER_ID: Joi.string().required(),

  // Мережевий режим САМОГО telegram-бота (тільки публікація в канал + опційні алерти
  // власнику). Керування ботом іде через адмінку (Next.js), не через Telegram-команди.
  BOT_MODE: Joi.string().valid('polling', 'webhook').default('polling'),
  WEBHOOK_URL: Joi.string().uri().allow('').default(''),
  WEBHOOK_PATH: Joi.string().default('/telegram/webhook'),
  BOT_WEBHOOK_PORT: Joi.number().default(3034),

  OPENAI_API_KEY: Joi.string().required(),
  OPENAI_MODEL: Joi.string().default('gpt-4o-mini'),
  PROMPT_TEMPLATE: Joi.string().required(),

  DAILY_HOUR: Joi.number().min(0).max(23).default(9),
  DAILY_MINUTE: Joi.number().min(0).max(59).default(0),

  DATABASE_URL: Joi.string().required(),

  // Адмінка (спільна з рештою проекту) авторизується через JWT, виданий apps/api.
  BOT_PORT: Joi.number().default(3033),
  BOT_PANEL_URL: Joi.string().uri().allow('').default(''),
  JWT_SECRET: Joi.string().required(),
}).unknown(true);

// WEBHOOK_URL є обов'язковим лише при BOT_MODE=webhook — перевіряється окремо
// (не через Joi.when), щоб схема лишалась простою та явно перевіряти в bootstrap.
export function assertWebhookConfig(env: Record<string, string | undefined>) {
  if (env.BOT_MODE === 'webhook' && !env.WEBHOOK_URL) {
    throw new Error('WEBHOOK_URL обов\'язковий, якщо BOT_MODE=webhook');
  }
}
