import { InMemoryOrderRepository } from '../testing/in-memory-order.repository';
import { TEST_WALLET, testConfig } from '../testing/test-config';
import type { Order } from './domain/order';
import type { Trc20Transfer } from './domain/transfer';
import { OrderEvents } from './order-events';
import { DuplicateAmountError } from './order.repository';
import { PaymentsService, WalletNotConfiguredError } from './payments.service';

function transfer(amountKey: string, txId = 'tx-1', timestamp = Date.now()): Trc20Transfer {
  return {
    txId,
    from: 'TSenderAddress',
    to: TEST_WALLET,
    amountKey,
    rawValue: '0',
    symbol: 'USDT',
    timestamp,
  };
}

describe('PaymentsService', () => {
  let repo: InMemoryOrderRepository;
  let events: OrderEvents;
  let service: PaymentsService;

  beforeEach(() => {
    repo = new InMemoryOrderRepository();
    events = new OrderEvents();
    service = new PaymentsService(repo, events, testConfig());
  });

  describe('createOrder', () => {
    it('выдаёт сумму с хвостом от цены уровня', async () => {
      const order = await service.createOrder(1, 'basic');

      expect(order.baseAmount).toBe(10);
      expect(order.amount).toBeGreaterThan(10);
      expect(order.amount).toBeLessThan(11);
      expect(order.amountKey).toMatch(/^10[.]\d{4}$/);
      expect(order.wallet).toBe(TEST_WALLET);
      expect(order.status).toBe('pending');
    });

    it('даёт разным заказам разные суммы', async () => {
      const orders = await Promise.all([
        service.createOrder(1, 'medium'),
        service.createOrder(2, 'medium'),
        service.createOrder(3, 'medium'),
      ]);

      const keys = orders.map((o) => o.amountKey);
      expect(new Set(keys).size).toBe(3);
      expect(keys.every((key) => key.startsWith('25.'))).toBe(true);
    });

    it('повторный запрос того же уровня возвращает тот же заказ', async () => {
      const first = await service.createOrder(7, 'advanced');
      const second = await service.createOrder(7, 'advanced');

      expect(second.orderId).toBe(first.orderId);
      expect(repo.orders).toHaveLength(1);
    });

    it('переживает гонку за сумму и берёт другой хвост', async () => {
      // Соседний процесс успел занять ту же сумму между выборкой занятых и
      // вставкой — хранилище отвечает DuplicateAmountError.
      const real = repo.insert.bind(repo);
      let calls = 0;
      repo.insert = (order: Order) => {
        calls += 1;
        return calls === 1
          ? Promise.reject(new DuplicateAmountError(order.amountKey))
          : real(order);
      };

      const order = await service.createOrder(9, 'basic');

      expect(calls).toBe(2);
      expect(order.amountKey).toMatch(/^10[.]\d{4}$/);
    });

    it('не берёт заказ, когда кошелёк не настроен', async () => {
      service = new PaymentsService(repo, events, testConfig({ TRON_WALLET_ADDRESS: '' }));

      await expect(service.createOrder(1, 'basic')).rejects.toBeInstanceOf(
        WalletNotConfiguredError,
      );
    });
  });

  describe('settle', () => {
    it('закрывает заказ переводом ровно на его сумму', async () => {
      const order = await service.createOrder(1, 'basic');

      const paid = await service.settle([transfer(order.amountKey, 'tx-abc')]);

      expect(paid).toHaveLength(1);
      expect(paid[0]).toMatchObject({ orderId: order.orderId, status: 'paid', txId: 'tx-abc' });
    });

    it('игнорирует перевод на сумму без заказа', async () => {
      await service.createOrder(1, 'basic');

      expect(await service.settle([transfer('10.9999')])).toEqual([]);
    });

    it('разводит одновременные заказы по хвостам суммы', async () => {
      const first = await service.createOrder(1, 'basic');
      const second = await service.createOrder(2, 'basic');

      const paid = await service.settle([transfer(second.amountKey, 'tx-2')]);

      expect(paid.map((o) => o.telegramId)).toEqual([2]);
      expect((await service.findOrder(first.orderId))?.status).toBe('pending');
    });

    it('не закрывает один заказ дважды', async () => {
      const order = await service.createOrder(1, 'basic');

      await service.settle([transfer(order.amountKey, 'tx-1')]);

      expect(await service.settle([transfer(order.amountKey, 'tx-1')])).toEqual([]);
    });

    it('не принимает перевод, отправленный после конца срока', async () => {
      const order = await service.createOrder(1, 'basic');
      repo.orders[0].expiresAt = new Date(Date.now() - 1000);

      expect(await service.settle([transfer(order.amountKey)])).toEqual([]);
    });

    it('засчитывает платёж, отправленный до конца срока, даже если заказ уже просрочен', async () => {
      const order = await service.createOrder(1, 'basic');
      const sentAt = Date.now();
      repo.orders[0].expiresAt = new Date(sentAt + 1000);
      repo.orders[0].status = 'expired';

      const paid = await service.settle([transfer(order.amountKey, 'tx-late', sentAt)]);

      expect(paid.map((o) => o.orderId)).toEqual([order.orderId]);
    });

    it('не отдаёт старый перевод новому заказу с той же суммой', async () => {
      const order = await service.createOrder(1, 'basic');
      // Перевод ушёл за час до заказа: так выглядит платёж по прошлому
      // заказу, перечитанный после рестарта.
      const old = transfer(order.amountKey, 'tx-old', Date.now() - 60 * 60_000);

      expect(await service.settle([old])).toEqual([]);
    });

    it('одна транзакция не закрывает два заказа', async () => {
      const first = await service.createOrder(1, 'basic');
      await service.settle([transfer(first.amountKey, 'tx-once')]);

      // Сумма освободилась и досталась следующему заказу.
      const second = await service.createOrder(2, 'basic');
      repo.orders[1].amountKey = first.amountKey;

      expect(await service.settle([transfer(first.amountKey, 'tx-once')])).toEqual([]);
      expect((await service.findOrder(second.orderId))?.status).toBe('pending');
    });

    it('сообщает об оплате через OrderEvents', async () => {
      const seen: string[] = [];
      events.onPaid((order) => {
        seen.push(order.orderId);
      });
      const order = await service.createOrder(1, 'medium');

      await service.settle([transfer(order.amountKey)]);

      expect(seen).toEqual([order.orderId]);
    });
  });

  describe('жизненный цикл заказа', () => {
    it('освобождает сумму просроченного заказа', async () => {
      const order = await service.createOrder(1, 'basic');
      repo.orders[0].expiresAt = new Date(Date.now() - 1);

      expect(await service.expireStale()).toBe(1);

      const reused = await service.createOrder(1, 'basic');
      expect(reused.orderId).not.toBe(order.orderId);
    });

    it('отменяет заказ только его владельцу', async () => {
      const order = await service.createOrder(1, 'basic');

      expect(await service.cancelOrder(order.orderId, 999)).toBeNull();
      expect(await service.cancelOrder(order.orderId, 1)).toMatchObject({ status: 'cancelled' });
    });

    it('помнит, по каким оплаченным заказам материалы ещё не ушли', async () => {
      const order = await service.createOrder(1, 'basic');
      await service.settle([transfer(order.amountKey)]);

      expect(await service.findUndelivered()).toHaveLength(1);

      await service.markDelivered(order.orderId);
      expect(await service.findUndelivered()).toHaveLength(0);
    });
  });
});
