import { USDT_TRC20_CONTRACT } from '../../config/app-config';
import { TEST_WALLET as WALLET, testConfig } from '../../testing/test-config';
import { TronGridClient } from './trongrid.client';

type FetchMock = jest.Mock<Promise<Partial<Response>>, [URL | string, RequestInit?]>;

function respond(items: unknown[]) {
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({ data: items }),
  });
}

function item(overrides: Record<string, unknown> = {}) {
  return {
    transaction_id: 'tx-1',
    from: 'TSender',
    to: WALLET,
    value: '10030400',
    type: 'Transfer',
    block_timestamp: 1_700_000_000_000,
    token_info: { symbol: 'USDT', address: USDT_TRC20_CONTRACT, decimals: 6 },
    ...overrides,
  };
}

describe('TronGridClient', () => {
  let service: TronGridClient;
  let fetchMock: FetchMock;

  beforeEach(() => {
    service = new TronGridClient(testConfig());
    fetchMock = jest.fn() as unknown as FetchMock;
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('молчит, пока не заданы кошелёк и ключ', async () => {
    service = new TronGridClient(testConfig({ TRON_WALLET_ADDRESS: '' }));

    expect(await service.fetchIncoming(0)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('спрашивает только входящие подтверждённые переводы USDT', async () => {
    fetchMock.mockReturnValue(respond([]));

    await service.fetchIncoming(1_700_000_000_000);

    const [url, init] = fetchMock.mock.calls[0];
    const parsed = new URL(String(url));
    expect(parsed.pathname).toBe(`/v1/accounts/${WALLET}/transactions/trc20`);
    expect(parsed.searchParams.get('only_to')).toBe('true');
    expect(parsed.searchParams.get('only_confirmed')).toBe('true');
    expect(parsed.searchParams.get('min_timestamp')).toBe('1700000000000');
    expect(parsed.searchParams.get('contract_address')).toBe(USDT_TRC20_CONTRACT);
    expect((init?.headers as Record<string, string>)['TRON-PRO-API-KEY']).toBe('test-key');
  });

  it('приводит перевод к ключу суммы', async () => {
    fetchMock.mockReturnValue(respond([item()]));

    const [transfer] = await service.fetchIncoming(0);

    expect(transfer).toMatchObject({
      txId: 'tx-1',
      from: 'TSender',
      to: WALLET,
      amountKey: '10.0304',
      symbol: 'USDT',
      timestamp: 1_700_000_000_000,
    });
  });

  it('отбрасывает всё, что не перевод на наш адрес', async () => {
    fetchMock.mockReturnValue(
      respond([
        item({ type: 'Approval' }),
        item({ to: 'TSomeoneElse', transaction_id: 'tx-2' }),
        item({ transaction_id: undefined }),
        item({ value: undefined, transaction_id: 'tx-3' }),
        item({ block_timestamp: undefined, transaction_id: 'tx-4' }),
      ]),
    );

    expect(await service.fetchIncoming(0)).toEqual([]);
  });

  it('не роняет тик, когда TronGrid отвечает ошибкой', async () => {
    fetchMock.mockReturnValue(
      Promise.resolve({ ok: false, status: 503, statusText: 'Service Unavailable' }),
    );

    expect(await service.fetchIncoming(0)).toEqual([]);
  });

  it('не роняет тик, когда сеть недоступна', async () => {
    fetchMock.mockReturnValue(Promise.reject(new Error('ECONNRESET')) as never);

    expect(await service.fetchIncoming(0)).toEqual([]);
  });
});
