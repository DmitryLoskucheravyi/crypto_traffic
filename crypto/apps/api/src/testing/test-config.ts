import { loadConfig, type AppConfig } from '../config/app-config';

export const TEST_WALLET = 'TStubWalletAddressForTests000000000';

/** Конфиг для тестов — через тот же loadConfig, что и в проде. */
export function testConfig(env: NodeJS.ProcessEnv = {}): AppConfig {
  return loadConfig({
    MONGO_URI: 'mongodb://test/test',
    TRON_WALLET_ADDRESS: TEST_WALLET,
    TRONGRID_API_KEY: 'test-key',
    ...env,
  });
}
