import { testConfig } from '../testing/test-config';
import type { Trc20Transfer } from './domain/transfer';
import { PaymentsService } from './payments.service';
import { TronGridClient } from './tron/trongrid.client';
import { TronWatcherService } from './tron-watcher.service';

function transfer(amountKey: string, timestamp: number, txId = amountKey): Trc20Transfer {
  return {
    txId,
    from: 'TSender',
    to: 'TWallet',
    amountKey,
    rawValue: '0',
    symbol: 'USDT',
    timestamp,
  };
}

function makeStubs(env: NodeJS.ProcessEnv = {}) {
  const tron = {
    fetchIncoming: jest.fn<Promise<Trc20Transfer[]>, [number, number?]>(),
  };
  const payments = {
    expireStale: jest.fn().mockResolvedValue(0),
    settle: jest.fn().mockResolvedValue([]),
  };
  const watcher = new TronWatcherService(
    tron as unknown as TronGridClient,
    payments as unknown as PaymentsService,
    testConfig(env),
  );
  return { tron, payments, watcher };
}

describe('TronWatcherService', () => {
  it('гасит просроченные заказы и отдаёт переводы на сверку', async () => {
    const { tron, payments, watcher } = makeStubs();
    tron.fetchIncoming.mockResolvedValue([transfer('10.0304', 1_000)]);

    await watcher.tick();

    expect(payments.expireStale).toHaveBeenCalledTimes(1);
    expect(payments.settle).toHaveBeenCalledWith([transfer('10.0304', 1_000)]);
  });

  it('двигает курсор за последний разобранный перевод', async () => {
    const { tron, watcher } = makeStubs();
    tron.fetchIncoming
      .mockResolvedValueOnce([transfer('10.0001', 5_000), transfer('10.0002', 7_000)])
      .mockResolvedValueOnce([]);

    await watcher.tick();
    await watcher.tick();

    expect(tron.fetchIncoming).toHaveBeenNthCalledWith(2, 7_001);
  });

  it('оставляет курсор на месте, когда ничего не пришло', async () => {
    const { tron, watcher } = makeStubs();
    tron.fetchIncoming.mockResolvedValue([]);

    await watcher.tick();
    const firstCursor = tron.fetchIncoming.mock.calls[0][0];
    await watcher.tick();

    expect(tron.fetchIncoming.mock.calls[1][0]).toBe(firstCursor);
  });

  it('не запускает второй проход поверх незавершённого', async () => {
    const { tron, watcher } = makeStubs();
    let release: (value: Trc20Transfer[]) => void = () => {};
    tron.fetchIncoming.mockReturnValueOnce(
      new Promise<Trc20Transfer[]>((resolve) => {
        release = resolve;
      }),
    );

    const first = watcher.tick();
    await watcher.tick();

    expect(tron.fetchIncoming).toHaveBeenCalledTimes(1);

    release([]);
    await first;
  });

  it('переживает падение провайдера, не роняя процесс', async () => {
    const { tron, watcher } = makeStubs();
    tron.fetchIncoming.mockRejectedValue(new Error('TronGrid лёг'));

    await expect(watcher.tick()).resolves.toBeUndefined();

    tron.fetchIncoming.mockResolvedValue([]);
    await expect(watcher.tick()).resolves.toBeUndefined();
  });

  it('не стартует таймер без реквизитов', () => {
    const { tron, watcher } = makeStubs({ TRONGRID_API_KEY: '' });

    watcher.onModuleInit();

    expect(tron.fetchIncoming).not.toHaveBeenCalled();
    watcher.onModuleDestroy();
  });
});
