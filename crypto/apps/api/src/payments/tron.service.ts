import { Injectable, Logger } from '@nestjs/common';
import { transferAmountKey } from './amount';

/** Официальный контракт USDT в сети TRON (TRC20). */
export const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

export type Trc20Transfer = {
  txId: string;
  from: string;
  to: string;
  /** Сумма в виде ключа с 4 знаками — в этом виде она сравнивается с заказом. */
  amountKey: string;
  /** Сырое значение из ончейна, в минимальных единицах токена. */
  rawValue: string;
  symbol: string;
  timestamp: number;
};

type TronGridItem = {
  transaction_id?: string;
  from?: string;
  to?: string;
  value?: string;
  type?: string;
  block_timestamp?: number;
  token_info?: { symbol?: string; address?: string; decimals?: number };
};

/**
 * Тонкий клиент TronGrid: одна ручка — «входящие TRC20-переводы на наш кошелёк
 * начиная с момента X». Никакой бизнес-логики, чтобы её можно было тестировать
 * без сети, а этот файл заменить на другого провайдера, не трогая остальное.
 */
@Injectable()
export class TronService {
  private readonly logger = new Logger(TronService.name);

  get apiUrl(): string {
    return process.env.TRON_API_URL?.replace(/\/+$/, '') || 'https://api.trongrid.io';
  }

  get apiKey(): string {
    return process.env.TRONGRID_API_KEY ?? '';
  }

  get wallet(): string {
    return process.env.TRON_WALLET_ADDRESS ?? '';
  }

  get contract(): string {
    return process.env.USDT_TRC20_CONTRACT || USDT_TRC20_CONTRACT;
  }

  /**
   * Пока не заданы кошелёк и ключ, слушать нечего. Это не ошибка: так проект
   * поднимается и без платёжных реквизитов — бот работает, заказы создаются,
   * просто не закрываются автоматически.
   */
  get configured(): boolean {
    return Boolean(this.wallet) && Boolean(this.apiKey);
  }

  async fetchIncoming(sinceMs: number, limit = 200): Promise<Trc20Transfer[]> {
    if (!this.configured) return [];

    const url = new URL(`${this.apiUrl}/v1/accounts/${this.wallet}/transactions/trc20`);
    url.searchParams.set('only_to', 'true');
    url.searchParams.set('only_confirmed', 'true');
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('order_by', 'block_timestamp,asc');
    url.searchParams.set('min_timestamp', String(Math.max(0, Math.floor(sinceMs))));
    url.searchParams.set('contract_address', this.contract);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const res = await fetch(url, {
        headers: { 'TRON-PRO-API-KEY': this.apiKey, accept: 'application/json' },
        signal: controller.signal,
      });

      if (!res.ok) {
        this.logger.warn(`TronGrid ответил ${res.status} ${res.statusText}`);
        return [];
      }

      const body = (await res.json()) as { data?: TronGridItem[] };
      return (body.data ?? []).map((item) => this.toTransfer(item)).filter(isTransfer);
    } catch (error) {
      this.logger.warn(`TronGrid недоступен: ${(error as Error).message}`);
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }

  private toTransfer(item: TronGridItem): Trc20Transfer | null {
    if (!item.transaction_id || !item.value) return null;
    // TronGrid отдаёт и `Approval`, и переводы наружу — берём только то, что
    // реально пришло на наш адрес.
    if (item.type && item.type !== 'Transfer') return null;
    if (this.wallet && item.to && item.to !== this.wallet) return null;

    const decimals = item.token_info?.decimals ?? 6;

    return {
      txId: item.transaction_id,
      from: item.from ?? '',
      to: item.to ?? this.wallet,
      amountKey: transferAmountKey(item.value, decimals),
      rawValue: item.value,
      symbol: item.token_info?.symbol ?? 'USDT',
      timestamp: item.block_timestamp ?? Date.now(),
    };
  }
}

function isTransfer(value: Trc20Transfer | null): value is Trc20Transfer {
  return value !== null;
}
