import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TIERS, type CourseTier } from '../catalog/catalog';

export const ORDER_STATUSES = ['pending', 'paid', 'expired', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Prop({ required: true, unique: true, index: true })
  orderId: string;

  @Prop({ required: true, index: true })
  telegramId: number;

  @Prop({ type: String })
  username?: string;

  // type: String указан явно — по union-типу mongoose тип поля не выводит.
  @Prop({ required: true, type: String, enum: [...TIERS] })
  tier: CourseTier;

  /** Цена уровня из каталога, без хвоста. */
  @Prop({ required: true })
  baseAmount: number;

  /** Точная сумма перевода, которую назвали пользователю. */
  @Prop({ required: true })
  amount: number;

  /**
   * Та же сумма строкой с фиксированными 4 знаками — по ней ищется заказ, когда
   * приходит перевод. Именно поэтому она хранится отдельно от `amount`:
   * сравнивать double с double на попадание «ровно в сумму» нельзя.
   */
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

  /** Хеш транзакции, которой закрылся заказ. */
  @Prop({ type: String, index: true, sparse: true })
  txId?: string;

  /** Материалы отправлены в чат — чтобы повторный тик воркера не слал их дважды. */
  @Prop({ default: false })
  delivered: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export type OrderDocument = HydratedDocument<Order>;

export const OrderSchema = SchemaFactory.createForClass(Order);

// Две суммы, ждущие оплаты одновременно, совпасть не должны — иначе платёж
// нечем развести по заказам. Индекс частичный: у закрытых заказов сумма может
// повторяться сколько угодно.
OrderSchema.index(
  { amountKey: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } },
);
