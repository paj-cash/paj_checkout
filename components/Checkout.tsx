"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { useCheckout, useNow } from "@/lib/hooks";
import { returnUrl, screenFor } from "@/lib/screen";
import type { CheckoutView } from "@/lib/types";
import { sameMint } from "@/lib/chains";
import { ChainPicker } from "./ChainPicker";
import { DepositPanel } from "./DepositPanel";
import { TokenPicker } from "./TokenPicker";
import {
  CancelledPanel,
  ExpiredPanel,
  PaidPanel,
  PartlyPaidPanel,
} from "./StatusPanels";
import { Icon, PajMark } from "./ui";

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
  const { view, address } = useCheckout(token, initial, now);
  // Which network and token to show the payer, and whether they asked to pick
  // another network or another token.
  const [selectedChain, setSelectedChain] = useState<string>();
  const [selectedMint, setSelectedMint] = useState<string>();
  const [picking, setPicking] = useState<"network" | "token">();

  const screen = screenFor(view, {
    now,
    selectedChain,
    selectedMint,
    picking,
  });
  const returnTo = returnUrl(view);
  const optionFor = (chain: string) =>
    view.paymentOptions.find((option) => option.chain === chain);
  // Totals are kept in the stablecoin, the same dollar one on every chain
  // (USDC, or USDT on TON).
  const symbol =
    (
      view.depositAddresses.find((a) => a.chain === selectedChain) ??
      view.depositAddresses.at(-1)
    )?.tokens.find((t) => t.stable)?.symbol ?? "USDC";

  /** A network: on to its tokens, or straight to its stablecoin address. */
  async function pickNetwork(chain: string) {
    setSelectedChain(chain);
    if (optionFor(chain)?.anyToken) {
      setPicking("token");
      return;
    }
    await address(chain);
    setSelectedMint(undefined);
    setPicking(undefined);
  }

  /** A token on the chosen network: its address, set to take it. */
  async function pickToken(mint: string) {
    if (!selectedChain) return;
    const opened = await address(selectedChain, mint);
    const picked = opened.tokens.find((t) =>
      sameMint(opened.chain, t.mint, mint),
    );
    setSelectedMint(picked?.mint ?? opened.tokens.at(-1)?.mint);
    setPicking(undefined);
  }

  let body;
  switch (screen.kind) {
    case "choose":
      body = (
        <ChainPicker
          options={view.paymentOptions}
          expiresAt={view.expiresAt}
          now={now}
          onPick={pickNetwork}
          onBack={
            view.depositAddresses.length > 0
              ? () => setPicking(undefined)
              : undefined
          }
        />
      );
      break;
    case "chooseToken":
      body = (
        <TokenPicker
          checkoutToken={token}
          chain={screen.chain}
          onPick={pickToken}
          onBack={() => setPicking("network")}
        />
      );
      break;
    case "deposit":
      body = (
        <DepositPanel
          checkoutToken={token}
          view={view}
          address={screen.address}
          token={screen.token}
          now={now}
          others={screen.others}
          canChangeToken={!!optionFor(screen.address.chain)?.anyToken}
          onChangeToken={() => {
            setSelectedChain(screen.address.chain);
            setPicking("token");
          }}
          onChangeNetwork={() => setPicking("network")}
        />
      );
      break;
    case "paid":
      body = <PaidPanel view={view} symbol={symbol} returnTo={returnTo} />;
      break;
    case "partlyPaid":
      body = (
        <PartlyPaidPanel view={view} symbol={symbol} returnTo={returnTo} />
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
