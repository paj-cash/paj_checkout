/**
 * The shapes the PAJ API sends this page, mirrored from main_backend:
 * `PublicCheckoutSessionResDto` (GET /checkout/:token and every
 * CHECKOUT_UPDATE on the socket) and `PaymentResponseDto` (each transfer).
 */

export type CheckoutStatus = "OPEN" | "COMPLETED" | "EXPIRED" | "CANCELLED";

export type PaymentStatus =
  "INIT" | "AWAITING" | "PROCESSING" | "SUCCESSFUL" | "EXPIRED" | "ERROR";

export type Currency = "USD" | "NGN";

/** A stablecoin on a chain the payer may choose to pay with. */
export interface PaymentOption {
  chain: string;
  symbol: string;
  mint: string;
}

/** A transfer that arrived on one of the checkout's addresses. */
export interface CheckoutPayment {
  id: string;
  method: "TOKEN" | "FIAT";
  status: PaymentStatus;
  /** The part of it that pays the price, before the fee. */
  amount: number;
  fee?: number;
  totalAmount: number;
  /** What actually arrived. */
  receivedAmount?: number;
  token?: { chain: string; mint: string; address: string };
}

/** Where a checkout takes payment on one chain. */
export interface DepositAddress extends PaymentOption {
  address: string;
}

export interface CheckoutView {
  business: { name: string; logo?: string };
  reference: string;
  status: CheckoutStatus;
  amount: number;
  currency: Currency;
  /** NGN prices: naira per dollar the price was converted at, fixed. */
  rate?: number;
  /** What to send in all, in the stablecoin, fee included. */
  amountDue: number;
  /** What has arrived so far, in the stablecoin. */
  amountReceived: number;
  /** The fee included in `amountDue`. */
  fee: number;
  callbackUrl?: string;
  expiresAt: string;
  paymentOptions: PaymentOption[];
  /** The addresses opened so far, one per chain. */
  depositAddresses: DepositAddress[];
  /** The transfers that have arrived, newest first. */
  payments: CheckoutPayment[];
}
