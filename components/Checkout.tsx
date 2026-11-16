"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { useCheckout, useNow } from "@/lib/hooks";
import { isWaiting, returnUrl, screenFor } from "@/lib/screen";
import type { CheckoutPayment, CheckoutView } from "@/lib/types";
import { ChainPicker } from "./ChainPicker";
import { DepositPanel } from "./DepositPanel";
import { PaymentPanel } from "./PaymentPanel";
import {
  CancelledPanel,
  ConfirmingPanel,
  ExpiredPanel,
  PaidPanel,
  PartlyPaidPanel,
  UnderpaidPanel,
} from "./StatusPanels";
import { Icon, PajMark } from "./ui";

/** The stablecoin a payment is in, from the options it was chosen from. */
function symbolOf(view: CheckoutView, payment?: CheckoutPayment): string {
  const chain = payment?.token?.chain;
  return (
    view.paymentOptions.find((option) => option.chain === chain)?.symbol ??
    "USDC"
  );
}

/** Who is being paid, and how much. Shown above every screen. */
function Summary({ view }: { view: CheckoutView }) {
  const { business } = view;
  return (
    <div className="flex flex-col items-center gap-3 px-6 pt-7 pb-6 text-center">
      {business.logo ? (
        // A business's logo can be hosted anywhere it was uploaded to, so it
        // is loaded as-is rather than through the image optimiser.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={business.logo}
          alt=""
          className="h-14 w-14 rounded-2xl object-cover ring-1 ring-line"
        />
      ) : (
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 font-display text-xl font-semibold text-brand-600">
          {business.name.charAt(0).toUpperCase()}
        </span>
      )}
      <div>
        <p className="text-sm text-muted">Pay {business.name}</p>
        <p className="mt-1 font-display text-3xl font-semibold tracking-tight">
          {formatPrice(view.amount, view.currency)}
        </p>
        <p className="mt-1 font-mono text-xs text-faint">
          Ref {view.reference}
        </p>
      </div>
    </div>
  );
}

export function Checkout({
  token,
  initial,
}: {
  token: string;
  initial: CheckoutView;
}) {
  const now = useNow();
  const { view, start, address } = useCheckout(token, initial, now);
  // Which open payment (SINGLE) or address (RUNNING_TOTAL) to show when the
  // payer has more than one, and whether they asked to pick another network.
  const [selectedId, setSelectedId] = useState<string>();
  const [selectedChain, setSelectedChain] = useState<string>();
  const [choosing, setChoosing] = useState(false);

  const runningTotal = view.mode === "RUNNING_TOTAL";
  const screen = screenFor(view, { now, selectedId, selectedChain, choosing });
  const returnTo = returnUrl(view);
  const hasOpenPayment = runningTotal
    ? view.depositAddresses.length > 0
    : view.attempts.some((p) => isWaiting(p, now));
  // A running total's symbol comes from its addresses, which all take the
  // same dollar stablecoin (USDC, or USDT on TON).
  const runningSymbol =
    view.depositAddresses.find((a) => a.chain === selectedChain)?.symbol ??
    view.depositAddresses.at(-1)?.symbol ??
    "USDC";

  async function pay(chain: string) {
    if (runningTotal) {
      const opened = await address(chain);
      setSelectedChain(opened.chain);
    } else {
      const payment = await start(chain);
      setSelectedId(payment.id);
    }
    setChoosing(false);
  }

  let body;
  switch (screen.kind) {
    case "choose":
      body = (
        <ChainPicker
          options={view.paymentOptions}
          expiresAt={view.expiresAt}
          now={now}
          lapsed={screen.lapsed}
          onPick={pay}
          onBack={hasOpenPayment ? () => setChoosing(false) : undefined}
        />
      );
      break;
    case "deposit":
      body = (
        <DepositPanel
          view={view}
          address={screen.address}
          now={now}
          others={screen.others}
          onChangeNetwork={() => setChoosing(true)}
        />
      );
      break;
    case "paying":
      body = (
        <PaymentPanel
          payment={screen.payment}
          symbol={symbolOf(view, screen.payment)}
          now={now}
          others={screen.others}
          onChangeNetwork={() => setChoosing(true)}
        />
      );
      break;
    case "confirming":
      body = <ConfirmingPanel business={view.business.name} />;
      break;
    case "paid":
      body = (
        <PaidPanel
          view={view}
          payment={screen.payment}
          symbol={runningTotal ? runningSymbol : symbolOf(view, screen.payment)}
          returnTo={returnTo}
        />
      );
      break;
    case "partlyPaid":
      body = (
        <PartlyPaidPanel
          view={view}
          symbol={runningSymbol}
          returnTo={returnTo}
        />
      );
      break;
    case "underpaid":
      body = (
        <UnderpaidPanel
          view={view}
          payment={screen.payment}
          symbol={symbolOf(view, screen.payment)}
          returnTo={returnTo}
        />
      );
      break;
    case "cancelled":
      body = <CancelledPanel view={view} returnTo={returnTo} />;
      break;
    case "expired":
      body = <ExpiredPanel view={view} returnTo={returnTo} />;
      break;
  }

  return (
    <main className="flex min-h-dvh flex-col items-center px-4 py-6 sm:py-12">
      <div className="w-full max-w-md">
        <section className="overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(17,15,15,0.04),0_8px_24px_rgba(17,15,15,0.06)] ring-1 ring-line">
          <Summary view={view} />
          {/* Announces each new screen to screen readers as it appears. */}
          <div className="border-t border-line p-5 sm:p-6" aria-live="polite">
            {body}
          </div>
        </section>
        <footer className="mt-5 flex items-center justify-center gap-1.5 text-xs text-faint">
          <Icon name="lock" className="h-3.5 w-3.5" />
          Secured by
          <PajMark className="h-3.5 w-auto text-brand-500" />
          <span className="font-medium text-muted">PAJ</span>
        </footer>
      </div>
    </main>
  );
}
