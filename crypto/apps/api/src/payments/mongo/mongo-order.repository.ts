import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { CourseTier } from '../../catalog/catalog';
import { PAYABLE_STATUSES, paymentWindow, type Order } from '../domain/order';
import type { Trc20Transfer } from '../domain/transfer';
import { DuplicateAmountError, OrderRepository } from '../order.repository';
import { ORDER_MODEL, type OrderDocument } from './order.schema';

/** Служебные поля Mongo в домен не выходят. */
const PROJECTION = { _id: 0, __v: 0, updatedAt: 0 } as const;

@Injectable()
export class MongoOrderRepository extends OrderRepository {
  constructor(@InjectModel(ORDER_MODEL) private readonly model: Model<OrderDocument>) {
    super();
  }

  async insert(order: Order): Promise<Order> {
    try {
      await this.model.create(order);
      return order;
    } catch (error) {
      if (isDuplicateKeyError(error)) throw new DuplicateAmountError(order.amountKey);
      throw error;
    }
  }

  findById(orderId: string): Promise<Order | null> {
    return this.model.findOne({ orderId }, PROJECTION).lean<Order>().exec();
  }

  findAwaiting(telegramId: number, tier: CourseTier, now: Date): Promise<Order | null> {
    return this.model
      .findOne({ telegramId, tier, status: 'pending', expiresAt: { $gt: now } }, PROJECTION)
      .lean<Order>()
      .exec();
  }

  async pendingAmountKeys(): Promise<Set<string>> {
    const rows = await this.model
      .find({ status: 'pending' }, { amountKey: 1 })
      .lean<Array<{ amountKey: string }>>()
      .exec();
    return new Set(rows.map((row) => row.amountKey));
  }

  cancel(orderId: string, telegramId: number): Promise<Order | null> {
    return this.model
      .findOneAndUpdate(
        { orderId, telegramId, status: 'pending' },
        { $set: { status: 'cancelled' } },
        { new: true, projection: PROJECTION },
      )
      .lean<Order>()
      .exec();
  }

  async expire(now: Date): Promise<number> {
    const res = await this.model
      .updateMany({ status: 'pending', expiresAt: { $lte: now } }, { $set: { status: 'expired' } })
      .exec();
    return res.modifiedCount ?? 0;
  }

  async isTxUsed(txId: string): Promise<boolean> {
    return (await this.model.exists({ txId }).exec()) !== null;
  }

  // Запрос — это isPayableBy из domain/order.ts, записанный языком Mongo.
  claimPaid(transfer: Trc20Transfer): Promise<Order | null> {
    const window = paymentWindow(transfer);
    return this.model
      .findOneAndUpdate(
        {
          amountKey: transfer.amountKey,
          status: { $in: PAYABLE_STATUSES },
          createdAt: { $lte: window.createdNoLaterThan },
          expiresAt: { $gte: window.expiresNoEarlierThan },
        },
        {
          $set: { status: 'paid', paidAt: new Date(transfer.timestamp), txId: transfer.txId },
        },
        { new: true, sort: { createdAt: 1 }, projection: PROJECTION },
      )
      .lean<Order>()
      .exec();
  }

  async markNotified(orderId: string): Promise<void> {
    await this.model.updateOne({ orderId }, { $set: { notified: true } }).exec();
  }

  async markDelivered(orderId: string): Promise<void> {
    await this.model.updateOne({ orderId }, { $set: { delivered: true } }).exec();
  }

  findUndelivered(): Promise<Order[]> {
    return this.model.find({ status: 'paid', delivered: false }, PROJECTION).lean<Order[]>().exec();
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}
