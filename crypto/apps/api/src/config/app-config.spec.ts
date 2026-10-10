import { ConfigError, USDT_TRC20_CONTRACT, loadConfig } from './app-config';

const BASE = { MONGO_URI: 'mongodb://localhost/test' };

describe('loadConfig', () => {
  it('без MONGO_URI не стартует', () => {
    expect(() => loadConfig({})).toThrow(ConfigError);
  });

  it('заполняет необязательное значениями по умолчанию', () => {
    const config = loadConfig(BASE);

    expect(config.port).toBe(3031);
    expect(config.telegramToken).toBeNull();
    expect(config.tron).toMatchObject({
      wallet: '',
      apiUrl: 'https://api.trongrid.io',
      contract: USDT_TRC20_CONTRACT,
      pollIntervalMs: 20_000,
      watcherEnabled: false,
    });
    expect(config.payments.ttlMinutes).toBe(60);
    expect(config.materials).toEqual({ basic: null, medium: null, advanced: null });
  });

  it('включает слушатель только при кошельке и ключе вместе', () => {
    expect(loadConfig({ ...BASE, TRON_WALLET_ADDRESS: 'TW' }).tron.watcherEnabled).toBe(false);
    expect(
      loadConfig({ ...BASE, TRON_WALLET_ADDRESS: 'TW', TRONGRID_API_KEY: 'k' }).tron.watcherEnabled,
    ).toBe(true);
  });

  it('не берёт интервал опроса меньше пяти секунд', () => {
    expect(loadConfig({ ...BASE, PAYMENT_POLL_INTERVAL_MS: '200' }).tron.pollIntervalMs).toBe(
      20_000,
    );
    expect(loadConfig({ ...BASE, PAYMENT_POLL_INTERVAL_MS: '45000' }).tron.pollIntervalMs).toBe(
      45_000,
    );
  });

  it('игнорирует мусор в числах и пробелы в строках', () => {
    const config = loadConfig({
      ...BASE,
      PORT: 'abc',
      PAYMENT_TTL_MINUTES: '-5',
      TRON_API_URL: ' https://tron.example/// ',
      COURSE_MATERIAL_BASIC: '  materials/basic.pdf ',
      COURSE_MATERIAL_MEDIUM: '   ',
    });

    expect(config.port).toBe(3031);
    expect(config.payments.ttlMinutes).toBe(60);
    expect(config.tron.apiUrl).toBe('https://tron.example');
    expect(config.materials.basic).toBe('materials/basic.pdf');
    expect(config.materials.medium).toBeNull();
  });
});
