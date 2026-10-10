import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TIERS, type CourseTier } from '../../catalog/catalog';
import { ORDER_STATUSES, type Order, type OrderStatus } from '../domain/order';

// Отображение доменного Order на коллекцию Mongo. Смысл полей описан в
// domain/order.ts — здесь только то, что касается хранения: типы и индексы.

@Schema({ timestamps: true, collection: 'orders' })
export class OrderRecord implements Order {
  @Prop({ required: true, unique: true, index: true })
  orderId: string;

  @Prop({ required: true, index: true })
  telegramId: number;

  @Prop({ type: String })
  username?: string;

  // type: String указан явно — по union-типу mongoose тип поля не выводит.
  @Prop({ required: true, type: String, enum: [...TIERS] })
  tier: CourseTier;

  @Prop({ required: true })
  baseAmount: number;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  amountKey: string;

  @Prop({ required: true })
  wallet: string;

  @Prop({
    required: true,
    type: String,
    enum: [...ORDER_STATUSES],
    default: 'pending',
    index: true,
  })
  status: OrderStatus;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({ type: String, index: true, sparse: true })
  txId?: string;

  @Prop({ default: false })
  notified: boolean;

  @Prop({ default: false })
  delivered: boolean;

  createdAt: Date;
}

export type OrderDocument = HydratedDocument<OrderRecord>;

/** Имя модели — прежнее, чтобы коллекция и индексы на живой базе не менялись. */
export const ORDER_MODEL = 'Order';

export const OrderSchema = SchemaFactory.createForClass(OrderRecord);

// Две суммы, ждущие оплаты одновременно, совпасть не должны — иначе платёж
// нечем развести по заказам. Индекс частичный: у закрытых заказов сумма может
// повторяться сколько угодно.
OrderSchema.index(
  { amountKey: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } },
);
