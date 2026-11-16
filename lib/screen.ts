import type { CheckoutPayment, CheckoutView, DepositAddress } from "./types";

/** What the page shows. Exactly one at a time. */
export type Screen =
  /** Paid in full. */
  | { kind: "paid" }
  /** Pick a network to get an address on. */
  | { kind: "choose" }
  /** Where to send, how much is left, what has arrived. */
  | { kind: "deposit"; address: DepositAddress; others: number }
  | { kind: "cancelled" }
  | { kind: "expired" }
  /** Ran out with only part of it paid. */
  | { kind: "partlyPaid" };

/**
 * A transfer that has arrived but isn't counted yet: being swept, or failed
 * and due a retry. Either way it counts once it settles.
 */
export const isConfirming = (payment: CheckoutPayment) =>
  payment.status === "PROCESSING" || payment.status === "ERROR";

/** The session can still give out an address. */
export const isOpen = (view: CheckoutView, now: number) =>
  view.status === "OPEN" && new Date(view.expiresAt).getTime() > now;

/**
 * Nothing more can happen: no live update is worth waiting for. A session past
 * its time isn't finished while a transfer on it is still being confirmed,
 * since that can still complete it.
 */
export function isFinished(view: CheckoutView, now: number): boolean {
  if (view.status === "COMPLETED" || view.status === "CANCELLED") return true;
  if (isOpen(view, now)) return false;
  return !view.payments.some(isConfirming);
}

/**
 * Picks the screen. There is no single payment to follow: the payer has an
 * address on each network they opened, and every transfer to any of them
 * counts until the total is reached. A transfer being confirmed shows on the
 * address screen rather than replacing it, since more may be due.
 */
export function screenFor(
  view: CheckoutView,
  {
    now,
    selectedChain,
    choosing,
  }: {
    now: number;
    /** Which network's address to show. */
    selectedChain?: string;
    choosing: boolean;
  },
): Screen {
  if (view.status === "COMPLETED") return { kind: "paid" };
  if (view.status === "CANCELLED") return { kind: "cancelled" };

  if (!isOpen(view, now)) {
    const somethingIn =
      view.amountReceived > 0 || view.payments.some(isConfirming);
    return { kind: somethingIn ? "partlyPaid" : "expired" };
  }

  const addresses = view.depositAddresses;
  if (choosing || !addresses.length) return { kind: "choose" };

  const address =
    addresses.find((a) => a.chain === selectedChain) ??
    addresses[addresses.length - 1];
  return { kind: "deposit", address, others: addresses.length - 1 };
}

/** What is still to send, never below zero. */
export function amountLeft(view: CheckoutView): number {
  const left = view.amountDue - view.amountReceived;
  // Rounded to the stablecoin's precision, so float noise never shows.
  return Math.max(0, Math.round(left * 1e6) / 1e6);
}

/**
 * Where to send the payer back to the business: its `callbackUrl` with the
 * checkout `reference` added. Nothing else is added on purpose — not even
 * the status — so a business has to look the reference up to learn whether it
 * was paid, rather than trust a URL anyone can type.
 */
export function returnUrl(view: CheckoutView): string | undefined {
  if (!view.callbackUrl) return undefined;
  try {
    const url = new URL(view.callbackUrl);
    if (url.protocol !== "https:") return undefined;
    url.searchParams.set("reference", view.reference);
    return url.toString();
  } catch {
    return undefined;
  }
}
