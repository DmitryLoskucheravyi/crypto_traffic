export default () => ({
  botToken: process.env.BOT_TOKEN,
  channelId: process.env.CHANNEL_ID,
  ownerId: process.env.OWNER_ID,

  botMode: (process.env.BOT_MODE ?? 'polling') as 'polling' | 'webhook',
  webhookUrl: process.env.WEBHOOK_URL ?? '',
  webhookPath: process.env.WEBHOOK_PATH ?? '/telegram/webhook',
  telegramWebhookPort: parseInt(process.env.TELEGRAM_WEBHOOK_PORT ?? '3001', 10),

  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  promptTemplate: process.env.PROMPT_TEMPLATE ?? '',

  dailyHour: parseInt(process.env.DAILY_HOUR ?? '9', 10),
  dailyMinute: parseInt(process.env.DAILY_MINUTE ?? '0', 10),

  databaseUrl: process.env.DATABASE_URL,

  panelPort: parseInt(process.env.PANEL_PORT ?? '3000', 10),
  panelUrl: process.env.PANEL_URL ?? '',
  adminUsername: process.env.ADMIN_USERNAME,
  adminPassword: process.env.ADMIN_PASSWORD,
  sessionSecret: process.env.SESSION_SECRET,
});
