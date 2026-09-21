import { Model } from 'mongoose';
import { PaymentsService, WalletNotConfiguredError } from './payments.service';
import type { Order, OrderDocument } from './order.schema';
import type { Trc20Transfer } from './tron.service';

const WALLET = 'TStubWalletAddressForTests000000000';

type Doc = Record<string, any>;

/**
 * Мини-Mongo на массиве: поддерживает ровно те формы запросов, которыми
 * пользуется PaymentsService. Так тесты не требуют ни контейнера, ни сети —
 * а значит, реально гоняются в CI на каждом пуше.
 */
class FakeOrderModel {
  docs: Doc[] = [];

  create(doc: Doc) {
    if (doc.status === 'pending' && this.docs.some(isPendingWith(doc.amountKey))) {
      return Promise.reject(Object.assign(new Error('duplicate key'), { code: 11000 }));
    }
    const stored = { ...doc, createdAt: new Date(), updatedAt: new Date() };
    this.docs.push(stored);
    return Promise.resolve({ toObject: () => ({ ...stored }) });
  }

  findOne(filter: Doc) {
    return lean(() => {
      const found = this.docs.find((doc) => matches(doc, filter));
      return found ? { ...found } : null;
    });
  }

  find(filter: Doc) {
    return lean(() => this.docs.filter((doc) => matches(doc, filter)).map((doc) => ({ ...doc })));
  }

  findOneAndUpdate(filter: Doc, update: Doc) {
    return lean(() => {
      const found = this.docs
        .filter((doc) => matches(doc, filter))
        .sort((a, b) => a.createdAt - b.createdAt)[0];
      if (!found) return null;
      Object.assign(found, update.$set ?? {});
      return { ...found };
    });
  }

  updateMany(filter: Doc, update: Doc) {
    return exec(() => {
      const hits = this.docs.filter((doc) => matches(doc, filter));
      hits.forEach((doc) => Object.assign(doc, update.$set ?? {}));
      return { modifiedCount: hits.length };
    });
  }

  updateOne(filter: Doc, update: Doc) {
    return exec(() => {
      const found = this.docs.find((doc) => matches(doc, filter));
      if (found) Object.assign(found, update.$set ?? {});
      return { modifiedCount: found ? 1 : 0 };
    });
  }
}

const isPendingWith = (amountKey: string) => (doc: Doc) =>
  doc.status === 'pending' && doc.amountKey === amountKey;

function lean<T>(read: () => T) {
  return { lean: () => ({ exec: () => Promise.resolve(read()) }) };
}

function exec<T>(run: () => T) {
  return { exec: () => Promise.resolve(run()) };
}

function matches(doc: Doc, filter: Doc): boolean {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = doc[key];
    if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
      const ops = expected as Record<string, unknown>;
      if ('$gt' in ops && !(actual > (ops.$gt as never))) return false;
      if ('$lte' in ops && !(actual <= (ops.$lte as never))) return false;
      return true;
    }
    return actual === expected;
  });
}

function transfer(amountKey: string, txId = 'tx-1'): Trc20Transfer {
  return {
    txId,
    from: 'TSenderAddress',
    to: WALLET,
    amountKey,
    rawValue: '0',
    symbol: 'USDT',
    timestamp: Date.now(),
  };
}

describe('PaymentsService', () => {
  let model: FakeOrderModel;
  let service: PaymentsService;

  beforeEach(() => {
    process.env.TRON_WALLET_ADDRESS = WALLET;
    process.env.PAYMENT_TTL_MINUTES = '60';
    model = new FakeOrderModel();
    service = new PaymentsService(model as unknown as Model<OrderDocument>);
  });

  afterEach(() => {
    delete process.env.TRON_WALLET_ADDRESS;
    delete process.env.PAYMENT_TTL_MINUTES;
  });

  describe('createOrder', () => {
    it('выдаёт сумму с хвостом от цены уровня', async () => {
      const order = await service.createOrder(1, 'basic');

      expect(order.baseAmount).toBe(10);
      expect(order.amount).toBeGreaterThan(10);
      expect(order.amount).toBeLessThan(11);
      expect(order.amountKey).toMatch(/^10[.]\d{4}$/);
      expect(order.wallet).toBe(WALLET);
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
      expect(model.docs).toHaveLength(1);
    });

    it('переживает гонку по уникальному индексу и берёт другую сумму', async () => {
      // Соседний процесс успел занять ту же сумму между выборкой занятых и
      // вставкой — Mongo отвечает 11000, и заказ должен взять другой хвост.
      const real = model.create.bind(model);
      let calls = 0;
      model.create = ((doc: Doc) => {
        calls += 1;
        if (calls === 1) {
          return Promise.reject(Object.assign(new Error('duplicate key'), { code: 11000 }));
        }
        return real(doc);
      }) as FakeOrderModel['create'];

      const order = await service.createOrder(9, 'basic');

      expect(calls).toBe(2);
      expect(order.amountKey).toMatch(/^10[.]\d{4}$/);
    });

    it('не берёт заказ, когда кошелёк не настроен', async () => {
      delete process.env.TRON_WALLET_ADDRESS;

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
      expect(paid[0].orderId).toBe(order.orderId);
      expect(paid[0].status).toBe('paid');
      expect(paid[0].txId).toBe('tx-abc');
    });

    it('игнорирует перевод на сумму без заказа', async () => {
      await service.createOrder(1, 'basic');

      const paid = await service.settle([transfer('10.9999')]);

      expect(paid).toEqual([]);
    });

    it('разводит одновременные заказы по хвостам суммы', async () => {
      const first = await service.createOrder(1, 'basic');
      const second = await service.createOrder(2, 'basic');

      const paid = await service.settle([transfer(second.amountKey, 'tx-2')]);

      expect(paid).toHaveLength(1);
      expect(paid[0].telegramId).toBe(2);
      expect(await service.findActiveOrder(1)).toMatchObject({ orderId: first.orderId });
    });

    it('не закрывает один заказ дважды', async () => {
      const order = await service.createOrder(1, 'basic');

      await service.settle([transfer(order.amountKey, 'tx-1')]);
      const second = await service.settle([transfer(order.amountKey, 'tx-1')]);

      expect(second).toEqual([]);
    });

    it('не принимает оплату просроченного заказа', async () => {
      const order = await service.createOrder(1, 'basic');
      model.docs[0].expiresAt = new Date(Date.now() - 1000);

      const paid = await service.settle([transfer(order.amountKey)]);

      expect(paid).toEqual([]);
    });

    it('зовёт подписчиков на каждый закрытый заказ', async () => {
      const seen: Order[] = [];
      service.onPaid((order) => {
        seen.push(order);
      });
      const order = await service.createOrder(1, 'medium');

      await service.settle([transfer(order.amountKey)]);

      expect(seen.map((o) => o.orderId)).toEqual([order.orderId]);
    });

    it('падение одного подписчика не мешает остальным', async () => {
      const seen: string[] = [];
      service.onPaid(() => {
        throw new Error('bang');
      });
      service.onPaid((order) => {
        seen.push(order.orderId);
      });
      const order = await service.createOrder(1, 'basic');

      await expect(service.settle([transfer(order.amountKey)])).resolves.toHaveLength(1);
      expect(seen).toEqual([order.orderId]);
    });
  });

  describe('жизненный цикл заказа', () => {
    it('освобождает сумму просроченного заказа', async () => {
      const order = await service.createOrder(1, 'basic');
      model.docs[0].expiresAt = new Date(Date.now() - 1);

      expect(await service.expireStale()).toBe(1);

      const reused = await service.createOrder(2, 'basic');
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
