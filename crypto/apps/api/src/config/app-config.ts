import { TIERS, type CourseTier } from '../catalog/catalog';

// Вся конфигурация сервиса — одно неизменяемое значение, собранное из
// окружения ровно один раз, в точке входа. Дальше её получают через DI, и ни
// один сервис не читает process.env сам: так зависимость видна в
// конструкторе, а тест подставляет нужный конфиг без правки глобального
// состояния.

/** Официальный контракт USDT в сети TRON (TRC20). */
export const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

const DEFAULT_PORT = 3031;
const DEFAULT_TRON_API_URL = 'https://api.trongrid.io';
const DEFAULT_POLL_MS = 20_000;
const MIN_POLL_MS = 5_000;
const DEFAULT_TTL_MINUTES = 60;

export type AppConfig = Readonly<{
  port: number;
  mongoUri: string;
  /** null — бот выключен. */
  telegramToken: string | null;
  tron: Readonly<{
    /** Кошелёк приёма. Пустая строка — счёт выставить некуда. */
    wallet: string;
    apiKey: string;
    apiUrl: string;
    contract: string;
    pollIntervalMs: number;
    /** Слушателю есть что слушать: заданы и кошелёк, и ключ TronGrid. */
    watcherEnabled: boolean;
  }>;
  payments: Readonly<{ ttlMinutes: number }>;
  /** Сырое значение COURSE_MATERIAL_* по уровням; разбирает его materials.ts. */
  materials: Readonly<Record<CourseTier, string | null>>;
}>;

/** DI-токен: тип в рантайме не существует, поэтому провайдер ищется по нему. */
export const APP_CONFIG = Symbol('APP_CONFIG');

export const MATERIAL_ENV_BY_TIER: Readonly<Record<CourseTier, string>> = {
  basic: 'COURSE_MATERIAL_BASIC',
  medium: 'COURSE_MATERIAL_MEDIUM',
  advanced: 'COURSE_MATERIAL_ADVANCED',
};

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Чистая функция: окружение на входе, конфиг на выходе. Необязательное
 * получает значение по умолчанию, обязательное (MONGO_URI) без значения
 * останавливает старт с понятной ошибкой, а не падением где-то в драйвере.
 */
export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  const mongoUri = text(env.MONGO_URI);
  if (!mongoUri) throw new ConfigError('MONGO_URI не задан — заказы хранить негде');

  const wallet = text(env.TRON_WALLET_ADDRESS);
  const apiKey = text(env.TRONGRID_API_KEY);
  const poll = positive(env.PAYMENT_POLL_INTERVAL_MS);

  return {
    port: positive(env.PORT) ?? DEFAULT_PORT,
    mongoUri,
    telegramToken: text(env.TELEGRAM_BOT_TOKEN) || null,
    tron: {
      wallet,
      apiKey,
      apiUrl: (text(env.TRON_API_URL) || DEFAULT_TRON_API_URL).replace(/\/+$/, ''),
      contract: text(env.USDT_TRC20_CONTRACT) || USDT_TRC20_CONTRACT,
      pollIntervalMs: poll !== undefined && poll >= MIN_POLL_MS ? poll : DEFAULT_POLL_MS,
      watcherEnabled: Boolean(wallet && apiKey),
    },
    payments: { ttlMinutes: positive(env.PAYMENT_TTL_MINUTES) ?? DEFAULT_TTL_MINUTES },
    materials: Object.fromEntries(
      TIERS.map((tier) => [tier, text(env[MATERIAL_ENV_BY_TIER[tier]]) || null]),
    ) as Record<CourseTier, string | null>,
  };
}

function text(value: string | undefined): string {
  return value?.trim() ?? '';
}

function positive(value: string | undefined): number | undefined {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
