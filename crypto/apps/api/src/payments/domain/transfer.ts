/** Входящий перевод USDT TRC20 в том виде, в каком его понимает домен. */
export type Trc20Transfer = Readonly<{
  txId: string;
  from: string;
  to: string;
  /** Сумма в виде ключа с 4 знаками — в этом виде она сравнивается с заказом. */
  amountKey: string;
  /** Сырое значение из ончейна, в минимальных единицах токена. */
  rawValue: string;
  symbol: string;
  /** Время блока, мс. */
  timestamp: number;
}>;
