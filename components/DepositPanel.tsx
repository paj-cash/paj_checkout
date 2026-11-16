"use client";

import { chainInfo, paymentUri } from "@/lib/chains";
import { formatCountdown, formatToken } from "@/lib/format";
import { amountLeft } from "@/lib/screen";
import type {
  CheckoutPayment,
  CheckoutView,
  DepositAddress,
} from "@/lib/types";
import { ChainMark } from "./ChainMark";
import { CopyField } from "./CopyField";
import { QrCode } from "./QrCode";
import { Icon, Spinner } from "./ui";

/** Under this, the countdown turns amber so the payer knows to hurry. */
const HURRY_MS = 15 * 60 * 1000;

/**
 * How much of the total is in. Drawn as SVG rather than a sized div: the
 * page's CSP refuses inline styles, and an SVG width is an attribute.
 */
function Progress({ received, due }: { received: number; due: number }) {
  const percent = due > 0 ? Math.min(100, (received / due) * 100) : 0;
  return (
    <svg
      viewBox="0 0 100 6"
      preserveAspectRatio="none"
      className="h-1.5 w-full overflow-hidden rounded-full"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={due}
      aria-valuenow={received}
    >
      <rect width="100" height="6" rx="3" className="fill-line" />
      <rect width={percent} height="6" rx="3" className="fill-success" />
    </svg>
  );
}

/** One transfer that has arrived, on whichever chain. */
function Transfer({
  payment,
  symbol,
}: {
  payment: CheckoutPayment;
  symbol: string;
}) {
  const amount = payment.receivedAmount ?? payment.totalAmount;
  const chain = payment.token ? chainInfo(payment.token.chain).name : "";
  const confirmed = payment.status === "SUCCESSFUL";
  return (
    <li className="flex items-center gap-2 text-sm">
      {confirmed ? (
        <Icon name="check" className="h-4 w-4 text-success" />
      ) : (
        <Spinner className="h-4 w-4 text-brand-500" />
      )}
      <span className="font-mono font-medium">
        +{formatToken(amount)} {symbol}
      </span>
      <span className="text-muted">
        {chain && `on ${chain} · `}
        {confirmed ? "received" : "confirming"}
      </span>
    </li>
  );
}

/**
 * A running total: one address per chain, any number of transfers, from any
 * wallet. Shows what is left rather than one fixed amount, and every transfer
 * as it arrives, so the payer can see exactly where they stand.
 */
export function DepositPanel({
  view,
  address,
  now,
  others,
  onChangeNetwork,
}: {
  view: CheckoutView;
  address: DepositAddress;
  now: number;
  /** Other networks already opened on this checkout. */
  others: number;
  onChangeNetwork: () => void;
}) {
  const chain = chainInfo(address.chain).name;
  const symbol = address.symbol;
  const due = view.amountDue ?? 0;
  const received = view.amountReceived ?? 0;
  const left = amountLeft(view);
  const remaining = new Date(view.expiresAt).getTime() - now;
  const transfers = view.attempts.filter(
    (p) => p.status === "SUCCESSFUL" || p.status === "PROCESSING",
  );
  const confirming = transfers.some((p) => p.status === "PROCESSING");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ChainMark chain={address.chain} size="sm" />
        <h2 className="min-w-0 flex-1 font-display text-base font-semibold">
          Send {symbol} on {chain}
        </h2>
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

      {received > 0 && (
        <div className="space-y-2 rounded-2xl ring-1 ring-line p-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted">Paid so far</span>
            <span className="font-mono">
              <strong className="text-ink">{formatToken(received)}</strong>
              <span className="text-muted">
                {" "}
                of {formatToken(due)} {symbol}
              </span>
            </span>
          </div>
          <Progress received={received} due={due} />
        </div>
      )}

      <CopyField
        label={received > 0 ? "Amount left to send" : "Amount to send"}
        value={formatToken(left)}
        large
        display={
          <>
            {formatToken(left)}{" "}
            <span className="text-base font-medium text-muted">{symbol}</span>
          </>
        }
      />
      <p className="-mt-2 px-1 text-xs text-muted">
        {view.fee
          ? `Includes a ${formatToken(view.fee)} ${symbol} PAJ fee. `
          : ""}
        You can send it in more than one transfer, from any wallet.
      </p>

      <div className="flex flex-col items-center gap-2 rounded-2xl ring-1 ring-line p-4">
        <QrCode
          value={paymentUri(address.chain, address.address, address.mint, left)}
          label={`QR code for the ${chain} address to pay`}
        />
        <p className="text-xs text-muted">
          {address.chain === "SOLANA"
            ? "Scan with a Solana wallet to fill in what's left"
            : "Scan with your wallet to copy the address"}
        </p>
      </div>

      <CopyField label={`${chain} address`} value={address.address} />

      <div className="flex gap-2.5 rounded-xl bg-warning-50 p-3 text-sm text-warning">
        <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Send only <strong>{symbol}</strong> on <strong>{chain}</strong> to
          this address. Other tokens or networks won&rsquo;t count towards your
          payment.
        </p>
      </div>

      {transfers.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium text-muted">
            Transfers received
          </h3>
          <ul className="space-y-1.5">
            {transfers.map((payment) => (
              <Transfer key={payment.id} payment={payment} symbol={symbol} />
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 py-1 text-sm text-ink-soft">
        <Spinner className="h-4 w-4 text-brand-500" />
        {confirming
          ? "Confirming your transfer…"
          : received > 0
            ? "Waiting for the rest of your payment…"
            : "Waiting for your payment…"}
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
