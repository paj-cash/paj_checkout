/**
 * The shapes the PAJ API sends this page, mirrored from main_backend:
 * `PublicCheckoutSessionResDto` (GET /checkout/:token and every
 * CHECKOUT_UPDATE on the socket) and `PaymentResponseDto` (each transfer).
 */

export type CheckoutStatus = "OPEN" | "COMPLETED" | "EXPIRED" | "CANCELLED";

export type PaymentStatus =
  "INIT" | "AWAITING" | "PROCESSING" | "SUCCESSFUL" | "EXPIRED" | "ERROR";

export type Currency = "USD" | "NGN";

/** A chain the payer may pay on, with the stablecoin it settles in. */
export interface PaymentOption {
  chain: string;
  symbol: string;
  mint: string;
  /** Whether any token is taken here, or only the stablecoin. */
  anyToken: boolean;
}

/** A token a checkout address takes. */
export interface CheckoutToken {
  /** Mint, contract, or the native sentinel (wSOL mint, 0xEeee…, TON). */
  mint: string;
  symbol: string;
  name?: string;
  decimals: number;
  native: boolean;
  /** Counted for what arrives; anything else for what its swap produces. */
  stable: boolean;
}

/** A token the picker offers. */
export interface SuggestedToken {
  mint: string;
  symbol: string;
  name: string;
  native: boolean;
  stable: boolean;
}

/** What to send of a token to cover what is left. */
export interface Quote {
  chain: string;
  token: CheckoutToken;
  /** Whole tokens, any buffer included. */
  amount: number;
  /** What is left to pay, in the stablecoin. */
  amountLeft: number;
  pricePerToken: number;
  bufferPercent: number;
  quotedAt: string;
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
  /** What actually arrived, in the token sent. */
  receivedAmount?: number;
  /** The USDC it came to once swept: what counts towards the total. */
  usdcAmount?: number;
  token?: { chain: string; mint: string; address: string };
}

/** Where a checkout takes payment on one chain, and what it takes there. */
export interface DepositAddress {
  chain: string;
  address: string;
  /** The stablecoin first, then each token the payer picked. */
  tokens: CheckoutToken[];
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
