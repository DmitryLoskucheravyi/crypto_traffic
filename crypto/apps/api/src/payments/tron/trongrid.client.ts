import { Inject, Injectable, Logger } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../../config/app-config';
import type { Trc20Transfer } from '../domain/transfer';
import { incomingTransfersUrl, parseIncoming, type TronGridItem } from './trongrid';

const REQUEST_TIMEOUT_MS = 15_000;

/**
 * HTTP-клиент TronGrid: одна ручка, никакой бизнес-логики. Сеть и ошибки
 * провайдера гасятся здесь — наружу уходит пустой список, и проход слушателя
 * просто повторится. Замена провайдера = замена этого файла и trongrid.ts.
 */
@Injectable()
export class TronGridClient {
  private readonly logger = new Logger(TronGridClient.name);

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async fetchIncoming(sinceMs: number, limit = 200): Promise<Trc20Transfer[]> {
    const { tron } = this.config;
    if (!tron.watcherEnabled) return [];

    const url = incomingTransfersUrl({
      apiUrl: tron.apiUrl,
      wallet: tron.wallet,
      contract: tron.contract,
      sinceMs,
      limit,
    });

    try {
      const res = await fetch(url, {
        headers: { 'TRON-PRO-API-KEY': tron.apiKey, accept: 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!res.ok) {
        this.logger.warn(`TronGrid ответил ${res.status} ${res.statusText}`);
        return [];
      }

      const body = (await res.json()) as { data?: TronGridItem[] };
      return parseIncoming(body.data ?? [], tron.wallet);
    } catch (error) {
      this.logger.warn(`TronGrid недоступен: ${(error as Error).message}`);
      return [];
    }
  }
}
