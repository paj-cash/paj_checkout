/**
 * The shapes the PAJ API sends this page, mirrored from main_backend:
 * `PublicCheckoutSessionResDto` (GET /checkout/:token and every
 * CHECKOUT_UPDATE on the socket) and `PaymentResponseDto` (each attempt).
 */

export type CheckoutStatus = "OPEN" | "COMPLETED" | "EXPIRED" | "CANCELLED";

export type PaymentStatus =
  | "INIT"
  | "AWAITING"
  | "PROCESSING"
  | "SUCCESSFUL"
  | "EXPIRED"
  | "ERROR";

export type Currency = "USD" | "NGN";

/** A stablecoin on a chain the payer may choose to pay with. */
export interface PaymentOption {
  chain: string;
  symbol: string;
  mint: string;
}

/** A payment the payer started: where to send what, and where it stands. */
export interface CheckoutPayment {
  id: string;
  method: "TOKEN" | "FIAT";
  status: PaymentStatus;
  /** The price in the token, before the fee. */
  amount: number;
  fee?: number;
  /** What the payer must send. */
  totalAmount: number;
  /** What actually arrived, once something has. */
  receivedAmount?: number;
  expiresAt?: string;
  token?: { chain: string; mint: string; address: string };
}

export interface CheckoutView {
  business: { name: string; logo?: string };
  reference: string;
  status: CheckoutStatus;
  amount: number;
  currency: Currency;
  callbackUrl?: string;
  expiresAt: string;
  paymentOptions: PaymentOption[];
  /** Newest first; ones that ran out unpaid are already left out. */
  attempts: CheckoutPayment[];
}
