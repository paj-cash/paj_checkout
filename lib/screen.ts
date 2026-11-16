import type { CheckoutPayment, CheckoutView, DepositAddress } from "./types";

/**
 * How far short of `totalAmount` a deposit may fall and still settle. Matches
 * the API: anything shorter leaves the payment in ERROR, unsettled.
 */
const UNDERPAYMENT_TOLERANCE = 0.001;

/** What the page shows. Exactly one at a time. */
export type Screen =
  /** Paid. `payment` is the one that paid it, when the page has it. */
  | { kind: "paid"; payment?: CheckoutPayment }
  /** Money arrived and is being settled. */
  | { kind: "confirming"; payment: CheckoutPayment }
  /** Money arrived, but too little to settle. */
  | { kind: "underpaid"; payment: CheckoutPayment }
  /** A payment is open: show where to send what. */
  | { kind: "paying"; payment: CheckoutPayment; others: number }
  /** Pick a chain. `lapsed` when a payment window just ran out. */
  | { kind: "choose"; lapsed: boolean }
  /** A running total: where to send, how much is left, what has arrived. */
  | { kind: "deposit"; address: DepositAddress; others: number }
  | { kind: "cancelled" }
  | { kind: "expired" }
  /** A running total that ran out with only part of it paid. */
  | { kind: "partlyPaid" };

/** ERROR because the deposit was short, not because settling it failed. */
export const isUnderpaid = (payment: CheckoutPayment) =>
  payment.status === "ERROR" &&
  payment.receivedAmount !== undefined &&
  payment.receivedAmount < payment.totalAmount * (1 - UNDERPAYMENT_TOLERANCE);

/** Open and inside its window, by this browser's clock. */
export const isWaiting = (payment: CheckoutPayment, now: number) =>
  payment.status === "AWAITING" &&
  !!payment.expiresAt &&
  new Date(payment.expiresAt).getTime() > now;

/** The session can still take a new payment. */
export const isOpen = (view: CheckoutView, now: number) =>
  view.status === "OPEN" && new Date(view.expiresAt).getTime() > now;

/**
 * Nothing more can happen: no live update is worth waiting for. An expired
 * session isn't finished while a payment started before then can still land.
 */
export function isFinished(view: CheckoutView, now: number): boolean {
  if (view.status === "COMPLETED" || view.status === "CANCELLED") return true;
  if (isOpen(view, now)) return false;
  return !view.attempts.some(
    (payment) =>
      isWaiting(payment, now) ||
      payment.status === "PROCESSING" ||
      (payment.status === "ERROR" && !isUnderpaid(payment)),
  );
}

/**
 * Picks the screen. Money already moving outranks everything: once a payer
 * has paid, or something has arrived, that is what they need to see, whatever
 * state the rest of the session is in.
 */
export function screenFor(
  view: CheckoutView,
  {
    now,
    selectedId,
    selectedChain,
    choosing,
  }: {
    now: number;
    /** SINGLE: which open payment to show. */
    selectedId?: string;
    /** RUNNING_TOTAL: which chain's address to show. */
    selectedChain?: string;
    choosing: boolean;
  },
): Screen {
  if (view.mode === "RUNNING_TOTAL") {
    return runningTotalScreen(view, { now, selectedChain, choosing });
  }

  const paid = view.attempts.find((p) => p.status === "SUCCESSFUL");
  if (view.status === "COMPLETED" || paid)
    return { kind: "paid", payment: paid };

  const confirming = view.attempts.find(
    (p) =>
      p.status === "PROCESSING" || (p.status === "ERROR" && !isUnderpaid(p)),
  );
  if (confirming) return { kind: "confirming", payment: confirming };

  const underpaid = view.attempts.find(isUnderpaid);
  if (underpaid) return { kind: "underpaid", payment: underpaid };

  if (view.status === "CANCELLED") return { kind: "cancelled" };

  const open = isOpen(view, now);
  if (choosing && open) return { kind: "choose", lapsed: false };

  const waiting = view.attempts.filter((p) => isWaiting(p, now));
  if (waiting.length) {
    const payment = waiting.find((p) => p.id === selectedId) ?? waiting[0];
    return { kind: "paying", payment, others: waiting.length - 1 };
  }

  if (!open) return { kind: "expired" };

  // A payment the API still calls AWAITING but whose window this clock has
  // seen close: the payer was mid-payment, so say why the address went away.
  const lapsed = view.attempts.some((p) => p.status === "AWAITING");
  return { kind: "choose", lapsed };
}

/**
 * The screen for a running total. There is no single payment to follow: the
 * payer has an address on each chain they opened, and every transfer to any
 * of them counts until the total is reached. A transfer being confirmed shows
 * on the address screen rather than replacing it, since more may be due.
 */
function runningTotalScreen(
  view: CheckoutView,
  {
    now,
    selectedChain,
    choosing,
  }: { now: number; selectedChain?: string; choosing: boolean },
): Screen {
  if (view.status === "COMPLETED") {
    return {
      kind: "paid",
      payment: view.attempts.find((p) => p.status === "SUCCESSFUL"),
    };
  }
  if (view.status === "CANCELLED") return { kind: "cancelled" };

  if (!isOpen(view, now)) {
    const somethingIn =
      (view.amountReceived ?? 0) > 0 ||
      view.attempts.some((p) => p.status === "PROCESSING");
    return { kind: somethingIn ? "partlyPaid" : "expired" };
  }

  const addresses = view.depositAddresses;
  if (choosing || !addresses.length) return { kind: "choose", lapsed: false };

  const address =
    addresses.find((a) => a.chain === selectedChain) ??
    addresses[addresses.length - 1];
  return { kind: "deposit", address, others: addresses.length - 1 };
}

/** What is still to send on a running total, never below zero. */
export function amountLeft(view: CheckoutView): number {
  const left = (view.amountDue ?? 0) - (view.amountReceived ?? 0);
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
