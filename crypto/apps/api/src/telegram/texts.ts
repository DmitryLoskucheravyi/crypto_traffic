import type { Course } from '../catalog/catalog';
import { minutesLeft, type Order } from '../payments/domain/order';

// Тексты бота — чистые функции: данные на входе, строка на выходе. Время
// тоже приходит аргументом, поэтому одинаковый вход всегда даёт одинаковый
// текст, и тесты не зависят от часов.

export const NETWORK_LABEL = 'USDT · сеть TRON (TRC20)';

export function greeting(): string {
  return [
    '<b>CRYPTO SPHEERE</b> — обучение торговле криптовалютой.',
    '',
    'Выберите уровень курса. Дальше бот покажет цену и выдаст реквизиты для оплаты в USDT (TRC20).',
    'Материалы приходят автоматически, как только платёж появится в сети.',
  ].join('\n');
}

export function courseCard(course: Course): string {
  const includes = course.includes.map((line) => `• ${line}`).join('\n');

  return [
    `<b>${course.title}</b>`,
    '',
    course.description,
    '',
    '<b>Что входит:</b>',
    includes,
    '',
    `<b>Стоимость:</b> ${course.priceUsdt} USDT`,
  ].join('\n');
}

/**
 * Реквизиты. Сумма — главное в этом сообщении: платёж опознаётся именно по ней,
 * поэтому она вынесена отдельной строкой моноширинным блоком (в Telegram такой
 * блок копируется одним тапом) и сопровождается прямым предупреждением.
 */
export function invoice(course: Course, order: Order, now: Date): string {
  return [
    `<b>${course.title}</b> — оплата`,
    '',
    `Переведите <b>ровно</b> эту сумму, ${NETWORK_LABEL}:`,
    `<code>${order.amount.toFixed(4)}</code>`,
    '',
    'На адрес:',
    `<code>${order.wallet}</code>`,
    '',
    '⚠️ Сумма указана с точностью до четвёртого знака — именно по ней бот узнаёт ваш платёж.',
    'Перевод на другую сумму или в другой сети найти не получится.',
    '',
    `Реквизиты действительны до ${formatTime(order.expiresAt)} (${minutesLeft(order, now)} мин).`,
    'После зачисления материалы придут сюда автоматически.',
  ].join('\n');
}

export function pendingNotice(order: Order): string {
  return [
    'Платёж пока не виден в сети.',
    '',
    `Ждём перевод <code>${order.amount.toFixed(4)}</code> USDT (TRC20).`,
    'Обычно сеть подтверждает перевод за 1–3 минуты. Как только он дойдёт, бот пришлёт материалы сам — это сообщение можно не обновлять.',
  ].join('\n');
}

export function paidNotice(course: Course, order: Order): string {
  return [
    '✅ Оплата получена.',
    '',
    `<b>${course.title}</b> — доступ открыт.`,
    order.txId ? `Транзакция: <code>${order.txId}</code>` : '',
    '',
    'Материалы ниже. Они остаются в этом чате — доступ бессрочный.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function materialsFallback(course: Course): string {
  return [
    `<b>${course.title}</b>`,
    '',
    'Материалы готовятся к отправке — с вами свяжется менеджер в этом же чате.',
    'Оплата зафиксирована, повторять перевод не нужно.',
  ].join('\n');
}

export function alreadyDeliveredNotice(): string {
  return 'Оплата получена, материалы уже отправлены выше в этом чате.';
}

export function deliveryRetryNotice(): string {
  return 'Оплата получена, материалы отправляются. Если через минуту файла нет, нажмите кнопку ещё раз.';
}

export function cancelledNotice(): string {
  return 'Заказ отменён. Сумма освобождена — можно начать заново: /start';
}

export function expiredNotice(): string {
  return 'Срок действия реквизитов истёк. Нажмите /start и выберите курс заново — бот выдаст новую сумму.';
}

export function walletMissingNotice(): string {
  return 'Приём оплаты временно недоступен: реквизиты не настроены. Напишите позже.';
}

export function invoiceFailedNotice(): string {
  return 'Не получилось выставить счёт. Попробуйте ещё раз через минуту.';
}

export function unknownCourseNotice(): string {
  return 'Такого курса нет. Нажмите /start, чтобы увидеть актуальный список.';
}

function formatTime(date: Date): string {
  return (
    new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(date) + ' UTC'
  );
}
