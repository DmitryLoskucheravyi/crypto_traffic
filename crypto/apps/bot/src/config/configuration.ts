export default () => ({
  botToken: process.env.CHANNEL_BOT_TOKEN,
  channelId: process.env.CHANNEL_ID,
  ownerId: process.env.OWNER_ID,

  botMode: (process.env.BOT_MODE ?? 'polling') as 'polling' | 'webhook',
  webhookUrl: process.env.WEBHOOK_URL ?? '',
  webhookPath: process.env.WEBHOOK_PATH ?? '/telegram/webhook',
  telegramWebhookPort: parseInt(process.env.BOT_WEBHOOK_PORT ?? '3034', 10),

  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  promptTemplate: process.env.PROMPT_TEMPLATE ?? '',

  dailyHour: parseInt(process.env.DAILY_HOUR ?? '9', 10),
  dailyMinute: parseInt(process.env.DAILY_MINUTE ?? '0', 10),

  databaseUrl: process.env.DATABASE_URL,

  botPort: parseInt(process.env.BOT_PORT ?? '3033', 10),
  panelUrl: process.env.BOT_PANEL_URL ?? '',
  jwtSecret: process.env.JWT_SECRET,
});
