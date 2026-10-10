import type { Order } from './domain/order';
import { OrderEvents } from './order-events';

describe('OrderEvents', () => {
  it('падение одного подписчика не мешает остальным', async () => {
    const events = new OrderEvents();
    const seen: string[] = [];
    events.onPaid(() => {
      throw new Error('bang');
    });
    events.onPaid((order) => {
      seen.push(order.orderId);
    });

    await expect(events.emitPaid({ orderId: 'o-1' } as Order)).resolves.toBeUndefined();
    expect(seen).toEqual(['o-1']);
  });
});
