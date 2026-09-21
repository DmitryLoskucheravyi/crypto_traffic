import { PaymentsService } from './payments.service';
import type { Trc20Transfer } from './tron.service';
import { TronService } from './tron.service';
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

function makeStubs() {
  const tron = {
    configured: true,
    wallet: 'TWallet',
    fetchIncoming: jest.fn<Promise<Trc20Transfer[]>, [number, number?]>(),
  };
  const payments = {
    ttlMinutes: 60,
    expireStale: jest.fn().mockResolvedValue(0),
    settle: jest.fn().mockResolvedValue([]),
  };
  const watcher = new TronWatcherService(
    tron as unknown as TronService,
    payments as unknown as PaymentsService,
  );
  return { tron, payments, watcher };
}

describe('TronWatcherService', () => {
  afterEach(() => {
    delete process.env.PAYMENT_POLL_INTERVAL_MS;
  });

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

  it('не берёт интервал опроса меньше пяти секунд', () => {
    const { watcher } = makeStubs();

    process.env.PAYMENT_POLL_INTERVAL_MS = '200';
    expect(watcher.pollIntervalMs).toBe(20_000);

    process.env.PAYMENT_POLL_INTERVAL_MS = '45000';
    expect(watcher.pollIntervalMs).toBe(45_000);
  });

  it('не стартует таймер без реквизитов', () => {
    const { tron, watcher } = makeStubs();
    tron.configured = false;

    watcher.onModuleInit();

    expect(tron.fetchIncoming).not.toHaveBeenCalled();
    watcher.onModuleDestroy();
  });
});
