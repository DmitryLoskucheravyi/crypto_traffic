// Публичная конфигурация лендинга — единственный модуль, который читает
// окружение. Всё запекается в статику на сборке: поменялся домен, бот или
// аккаунт — правится .env и пересобирается сайт, а не код.
//
// Разбор — чистая функция buildPublicConfig. Переменные читаются ниже
// литералами process.env.NEXT_PUBLIC_*: только так Next подставляет их и в
// клиентский бандл (объект process.env целиком в браузер не попадает).

export type PublicConfig = Readonly<{
  /** Адрес сайта без слеша на конце — для canonical, sitemap, og:image. */
  siteUrl: string;
  bot: Readonly<{ username: string; url: string }>;
  /** Канал необязателен: null — иконки в футере нет. */
  channel: Readonly<{ username: string; url: string }> | null;
  instagram: Readonly<{ username: string; url: string }>;
}>;

export type RawPublicEnv = {
  siteUrl?: string;
  botUsername?: string;
  channelUsername?: string;
  instagramUsername?: string;
};

// Фолбэк на localhost намеренный: локально всё работает, а забытая переменная
// видна невооружённым глазом в <link rel="canonical"> и в sitemap.xml.
const DEFAULT_SITE_URL = 'http://localhost:3030';
// Фолбэк бота: сборка без .env всё ещё ведёт куда надо, а не в пустоту.
const DEFAULT_BOT_USERNAME = 'crypto_course_sell_bot';
// Instagram проекта. Переменная окружения его перекрывает.
const DEFAULT_INSTAGRAM_USERNAME = 'crypt0_spheere';

/**
 * Имя аккаунта из того, что вставили в .env: «name», «@name» и
 * «https://t.me/name» равнозначны, хвосты вида ?utm_source=… отбрасываются. Пригласительная ссылка t.me/+AbCdEf тоже
 * проходит — остаётся «+AbCdEf».
 */
export function accountHandle(raw: string | undefined): string {
  return (raw ?? '')
    .trim()
    .replace(/[?#].*$/, '')
    .replace(/^https?:\/\/[^/]+\//i, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '');
}

/**
 * Пустые строки считаются незаданными: docker compose передаёт незаданную
 * переменную именно пустой строкой.
 */
export function buildPublicConfig(env: RawPublicEnv): PublicConfig {
  const botUsername = accountHandle(env.botUsername) || DEFAULT_BOT_USERNAME;
  const channel = accountHandle(env.channelUsername);
  const instagram = accountHandle(env.instagramUsername) || DEFAULT_INSTAGRAM_USERNAME;

  return {
    siteUrl: (env.siteUrl?.trim() || DEFAULT_SITE_URL).replace(/\/+$/, ''),
    bot: { username: botUsername, url: `https://t.me/${botUsername}` },
    channel: channel ? { username: channel, url: `https://t.me/${channel}` } : null,
    instagram: { username: instagram, url: `https://www.instagram.com/${instagram}/` },
  };
}

export const config: PublicConfig = buildPublicConfig({
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
  channelUsername: process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_USERNAME,
  instagramUsername: process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME,
});

export const SITE_URL = config.siteUrl;
export const BOT_URL = config.bot.url;
