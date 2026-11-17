"use client";

import { useChains } from "@/lib/catalog";
import { paymentUri } from "@/lib/chains";
import {
  formatCountdown,
  formatPrice,
  formatToken,
  formatUsdPrice,
} from "@/lib/format";
import { useQuote } from "@/lib/hooks";
import { amountLeft, isConfirming, tokenOf } from "@/lib/screen";
import type {
  CheckoutPayment,
  CheckoutToken,
  CheckoutView,
  DepositAddress,
} from "@/lib/types";
import { ChainMark } from "./ChainMark";
import { CopyField } from "./CopyField";
import { QrCode } from "./QrCode";
import { TokenMark } from "./TokenMark";
import { Button, Icon, Spinner } from "./ui";

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

/**
 * One transfer that has arrived, on whichever chain, in whichever token. A
 * token other than the stablecoin shows what its swap came to once swept,
 * since that is what counted.
 */
function Transfer({
  view,
  payment,
  stableSymbol,
}: {
  view: CheckoutView;
  payment: CheckoutPayment;
  stableSymbol: string;
}) {
  const chainOf = useChains();
  const token = tokenOf(view, payment);
  const symbol = token?.symbol ?? "";
  const amount = payment.receivedAmount ?? payment.totalAmount;
  const chain = payment.token ? chainOf(payment.token.chain).name : "";
  const confirmed = payment.status === "SUCCESSFUL";
  const swapped = confirmed && token && !token.stable && payment.usdcAmount;
  return (
    <li className="flex items-center gap-2 text-sm">
      {confirmed ? (
        <Icon name="check" className="h-4 w-4 shrink-0 text-success" />
      ) : (
        <Spinner className="h-4 w-4 shrink-0 text-brand-500" />
      )}
      <span className="font-mono font-medium">
        +{formatToken(amount)} {symbol}
      </span>
      <span className="min-w-0 text-muted">
        {swapped
          ? `→ ${formatToken(payment.usdcAmount!)} ${stableSymbol} · `
          : ""}
        {chain && `on ${chain} · `}
        {confirmed ? "received" : "confirming"}
      </span>
    </li>
  );
}

/** "USDC", "USDC or SOL", "USDC, SOL or JUP". */
function listOf(tokens: CheckoutToken[]): string {
  const symbols = tokens.map((t) => t.symbol);
  if (symbols.length <= 1) return symbols.join("");
  return `${symbols.slice(0, -1).join(", ")} or ${symbols.at(-1)}`;
}

/**
 * Paying a checkout: one address per chain, which takes the stablecoin and
 * each token the payer picked, in any number of transfers, from any wallet.
 * Shows what is left in the token being paid with — live-quoted for anything
 * but the stablecoin — and every transfer as it arrives.
 */
export function DepositPanel({
  checkoutToken,
  view,
  address,
  token,
  now,
  others,
  canChangeToken,
  onChangeToken,
  onChangeNetwork,
}: {
  checkoutToken: string;
  view: CheckoutView;
  address: DepositAddress;
  token: CheckoutToken;
  now: number;
  /** Other networks already opened on this checkout. */
  others: number;
  canChangeToken: boolean;
  onChangeToken: () => void;
  onChangeNetwork: () => void;
}) {
  const chain = useChains()(address.chain).name;
  const stable = address.tokens.find((t) => t.stable) ?? token;
  const due = view.amountDue;
  const received = view.amountReceived;
  const left = amountLeft(view);
  const { quote, error, retry } = useQuote(
    checkoutToken,
    address.chain,
    token,
    left,
  );
  const remaining = new Date(view.expiresAt).getTime() - now;
  const transfers = view.payments.filter(
    (p) => p.status === "SUCCESSFUL" || isConfirming(p),
  );
  const confirming = transfers.some(isConfirming);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="relative inline-flex shrink-0">
          <TokenMark chain={address.chain} token={token} size="sm" />
          <span className="absolute -right-1 -bottom-1 inline-flex rounded-full ring-2 ring-white">
            <ChainMark chain={address.chain} size="xs" />
          </span>
        </span>
        <h2 className="min-w-0 flex-1 font-display text-base font-semibold">
          Send {token.symbol} on {chain}
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
                of {formatToken(due)} {stable.symbol}
              </span>
            </span>
          </div>
          <Progress received={received} due={due} />
        </div>
      )}

      {quote ? (
        <CopyField
          label={received > 0 ? "Amount left to send" : "Amount to send"}
          value={formatToken(quote.amount)}
          large
          display={
            <>
              {formatToken(quote.amount)}{" "}
              <span className="text-base font-medium text-muted">
                {token.symbol}
              </span>
            </>
          }
        />
      ) : error ? (
        <div className="space-y-2 rounded-xl bg-danger-50 p-3 text-sm text-danger">
          <p role="alert">{error}</p>
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-surface p-4 text-sm text-muted">
          <Spinner className="h-4 w-4 text-brand-500" />
          Getting a price for {token.symbol}…
        </div>
      )}
      <p className="-mt-2 px-1 text-xs text-muted">
        {!token.stable && quote
          ? `About ${formatToken(left)} ${stable.symbol} at ${formatUsdPrice(quote.pricePerToken)} per ${token.symbol}, plus ${quote.bufferPercent}% for price movement. ${token.symbol} is converted when it arrives; anything over the total goes to ${view.business.name}. `
          : ""}
        {view.rate
          ? `${formatPrice(view.amount, view.currency)} at ${formatPrice(view.rate, view.currency)} to the dollar. `
          : ""}
        {view.fee
          ? `The total includes a ${formatToken(view.fee)} ${stable.symbol} PAJ fee. `
          : ""}
        You can send it in more than one transfer, from any wallet.
      </p>

      {quote && (
        <div className="flex flex-col items-center gap-2 rounded-2xl ring-1 ring-line p-4">
          <QrCode
            value={paymentUri(
              address.chain,
              address.address,
              token,
              quote.amount,
            )}
            label={`QR code for the ${chain} address to pay`}
          />
          <p className="text-xs text-muted">
            {address.chain === "SOLANA"
              ? "Scan with a Solana wallet to fill in what's left"
              : "Scan with your wallet to copy the address"}
          </p>
        </div>
      )}

      <CopyField label={`${chain} address`} value={address.address} />

      <div className="flex gap-2.5 rounded-xl bg-warning-50 p-3 text-sm text-warning">
        <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Send only <strong>{listOf(address.tokens)}</strong> on{" "}
          <strong>{chain}</strong> to this address. Anything else won&rsquo;t
          count towards your payment.
        </p>
      </div>

      {transfers.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium text-muted">
            Transfers received
          </h3>
          <ul className="space-y-1.5">
            {transfers.map((payment) => (
              <Transfer
                key={payment.id}
                view={view}
                payment={payment}
                stableSymbol={stable.symbol}
              />
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

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {canChangeToken && (
          <button
            type="button"
            onClick={onChangeToken}
            className="rounded-lg px-2 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50"
          >
            Pay with another token
          </button>
        )}
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
