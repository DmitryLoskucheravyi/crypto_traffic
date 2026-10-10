import { transferAmountKey } from '../domain/amount';
import type { Trc20Transfer } from '../domain/transfer';

// Протокол TronGrid без сети: как собрать запрос и как прочитать ответ.
// Чистые функции — HTTP-клиент только связывает их с fetch.

export type TronGridItem = {
  transaction_id?: string;
  from?: string;
  to?: string;
  value?: string;
  type?: string;
  block_timestamp?: number;
  token_info?: { symbol?: string; address?: string; decimals?: number };
};

export type IncomingQuery = {
  apiUrl: string;
  wallet: string;
  contract: string;
  sinceMs: number;
  limit: number;
};

/** «Входящие подтверждённые TRC20-переводы на кошелёк, начиная с момента X». */
export function incomingTransfersUrl(query: IncomingQuery): URL {
  const url = new URL(`${query.apiUrl}/v1/accounts/${query.wallet}/transactions/trc20`);
  url.searchParams.set('only_to', 'true');
  url.searchParams.set('only_confirmed', 'true');
  url.searchParams.set('limit', String(query.limit));
  url.searchParams.set('order_by', 'block_timestamp,asc');
  url.searchParams.set('min_timestamp', String(Math.max(0, Math.floor(query.sinceMs))));
  url.searchParams.set('contract_address', query.contract);
  return url;
}

/**
 * Приводит запись TronGrid к переводу. TronGrid отдаёт и `Approval`, и
 * переводы наружу — берём только то, что реально пришло на наш адрес.
 */
export function toTransfer(item: TronGridItem, wallet: string): Trc20Transfer | null {
  if (!item.transaction_id || !item.value || item.block_timestamp === undefined) return null;
  if (item.type && item.type !== 'Transfer') return null;
  if (item.to && item.to !== wallet) return null;

  return {
    txId: item.transaction_id,
    from: item.from ?? '',
    to: item.to ?? wallet,
    amountKey: transferAmountKey(item.value, item.token_info?.decimals ?? 6),
    rawValue: item.value,
    symbol: item.token_info?.symbol ?? 'USDT',
    timestamp: item.block_timestamp,
  };
}

export function parseIncoming(items: readonly TronGridItem[], wallet: string): Trc20Transfer[] {
  return items
    .map((item) => toTransfer(item, wallet))
    .filter((t): t is Trc20Transfer => t !== null);
}
