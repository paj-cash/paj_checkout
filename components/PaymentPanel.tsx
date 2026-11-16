"use client";

import { chainInfo, paymentUri } from "@/lib/chains";
import { formatCountdown, formatToken } from "@/lib/format";
import type { CheckoutPayment } from "@/lib/types";
import { ChainMark } from "./ChainMark";
import { CopyField } from "./CopyField";
import { QrCode } from "./QrCode";
import { Icon, Spinner } from "./ui";

/** Under this, the countdown turns amber so the payer knows to hurry. */
const HURRY_MS = 5 * 60 * 1000;

/**
 * Where to send what, for one open payment. Everything the payer must get
 * exactly right — amount, network, address — is copyable, and the warning about
 * sending the right token on the right network sits next to them, not below
 * the fold.
 */
export function PaymentPanel({
  payment,
  symbol,
  now,
  others,
  onChangeNetwork,
}: {
  payment: CheckoutPayment;
  symbol: string;
  now: number;
  /** Other payments still open on this checkout, on other networks. */
  others: number;
  onChangeNetwork: () => void;
}) {
  const token = payment.token;
  if (!token) return null;

  const chain = chainInfo(token.chain).name;
  const remaining = payment.expiresAt
    ? new Date(payment.expiresAt).getTime() - now
    : 0;
  const amount = formatToken(payment.totalAmount);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ChainMark chain={token.chain} size="sm" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-semibold">
            Send {symbol} on {chain}
          </h2>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs font-medium tabular-nums ${
            remaining < HURRY_MS
              ? "bg-warning-50 text-warning"
              : "bg-surface text-ink-soft"
          }`}
          aria-label={`Time left: ${formatCountdown(remaining)}`}
        >
          <Icon name="clock" className="h-3.5 w-3.5" />
          {formatCountdown(remaining)}
        </span>
      </div>

      <CopyField
        label="Amount to send"
        value={amount}
        large
        display={
          <>
            {amount}{" "}
            <span className="text-base font-medium text-muted">{symbol}</span>
          </>
        }
      />
      {payment.fee ? (
        <p className="-mt-2 px-1 text-xs text-muted">
          Includes a {formatToken(payment.fee)} {symbol} PAJ fee.
        </p>
      ) : null}

      <div className="flex flex-col items-center gap-2 rounded-2xl ring-1 ring-line p-4">
        <QrCode
          value={paymentUri(
            token.chain,
            token.address,
            token.mint,
            payment.totalAmount,
          )}
          label={`QR code for the ${chain} address to pay`}
        />
        <p className="text-xs text-muted">
          {token.chain === "SOLANA"
            ? "Scan with a Solana wallet to fill in the amount"
            : "Scan with your wallet to copy the address"}
        </p>
      </div>

      <CopyField label={`${chain} address`} value={token.address} />

      <div className="flex gap-2.5 rounded-xl bg-warning-50 p-3 text-sm text-warning">
        <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Send only <strong>{symbol}</strong> on <strong>{chain}</strong>, and
          the exact amount. Other tokens or networks won&rsquo;t complete your
          payment, and a smaller amount won&rsquo;t either.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 py-1 text-sm text-ink-soft">
        <Spinner className="h-4 w-4 text-brand-500" />
        Waiting for your payment&hellip;
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onChangeNetwork}
          className="rounded-lg px-2 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50"
        >
          {others > 0
            ? `Pay on another network (${others} more open)`
            : "Pay on another network"}
        </button>
      </div>
    </div>
  );
}
