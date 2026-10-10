import { Markup } from 'telegraf';
import type { Course } from '../catalog/catalog';
import { CATALOG } from '../catalog/catalog';
import type { Order } from '../payments/domain/order';

// Клавиатуры бота — чистые функции, как и тексты. Формат callback_data
// описан здесь же, в одном месте: хендлеры разбирают ровно то, что здесь
// собирается.

export const CALLBACK = {
  menu: 'menu',
  tier: /^tier:(.+)$/,
  pay: /^pay:(.+)$/,
  check: /^check:(.+)$/,
  cancel: /^cancel:(.+)$/,
} as const;

export function catalogKeyboard() {
  return Markup.inlineKeyboard(
    CATALOG.map((course) => [Markup.button.callback(course.buttonLabel, `tier:${course.tier}`)]),
  );
}

export function courseKeyboard(course: Course) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`Оплатить ${course.priceUsdt} USDT`, `pay:${course.tier}`)],
    [Markup.button.callback('← К списку курсов', CALLBACK.menu)],
  ]);
}

export function invoiceKeyboard(order: Order) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Я оплатил — проверить', `check:${order.orderId}`)],
    [Markup.button.callback('Отменить заказ', `cancel:${order.orderId}`)],
  ]);
}
