"use client";

import { useEffect, useState, type ReactNode } from "react";
import { formatPrice, formatToken } from "@/lib/format";
import type { CheckoutView } from "@/lib/types";
import { ButtonLink, Icon } from "./ui";

/** How long the paid screen waits before sending the payer back. */
const RETURN_AFTER_S = 5;

const TONES = {
  success: "bg-success-50 text-success",
  progress: "bg-brand-50 text-brand-500",
  warning: "bg-warning-50 text-warning",
  neutral: "bg-surface text-muted",
};

function Status({
  tone,
  icon,
  title,
  children,
}: {
  tone: keyof typeof TONES;
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <span
        className={`inline-flex h-14 w-14 items-center justify-center rounded-full ${TONES[tone]}`}
      >
        {icon}
      </span>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="w-full space-y-3 text-sm text-ink-soft">{children}</div>
    </div>
  );
}

function ReturnLink({ href, business }: { href?: string; business: string }) {
  if (!href) return null;
  return (
    <ButtonLink href={href} variant="secondary">
      Return to {business}
    </ButtonLink>
  );
}

/** How many transfers the checkout was paid in. */
const transfersOf = (view: CheckoutView) =>
  view.payments.filter((p) => p.status === "SUCCESSFUL").length;

export function PaidPanel({
  view,
  symbol,
  returnTo,
}: {
  view: CheckoutView;
  symbol: string;
  returnTo?: string;
}) {
  const [left, setLeft] = useState(RETURN_AFTER_S);

  // Send the payer back on their own after a moment. They can always go now.
  useEffect(() => {
    if (!returnTo) return;
    if (left <= 0) {
      window.location.assign(returnTo);
      return;
    }
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [returnTo, left]);

  return (
    <Status
      tone="success"
      icon={<Icon name="check" className="h-7 w-7" />}
      title="Payment successful"
    >
      <p>
        {view.business.name} has received your payment of{" "}
        <strong className="text-ink">
          {formatPrice(view.amount, view.currency)}
        </strong>
        .
      </p>
      <p className="rounded-xl bg-surface p-3 text-xs text-muted">
        Paid {formatToken(view.amountReceived)} {symbol}
        {transfersOf(view) > 1 ? ` in ${transfersOf(view)} transfers` : ""}{" "}
        &middot; Ref {view.reference}
      </p>
      {returnTo && (
        <>
          <ReturnLink href={returnTo} business={view.business.name} />
          <p className="text-xs text-faint" aria-live="off">
            Returning you automatically in {Math.max(left, 0)}s
          </p>
        </>
      )}
    </Status>
  );
}

/**
 * A checkout that ran out before it was paid in full. What arrived is
 * already the business's, so the payer is pointed at the business to sort out
 * the rest or a refund — and told not to send more.
 */
export function PartlyPaidPanel({
  view,
  symbol,
  returnTo,
}: {
  view: CheckoutView;
  symbol: string;
  returnTo?: string;
}) {
  return (
    <Status
      tone="warning"
      icon={<Icon name="alert" className="h-7 w-7" />}
      title="This checkout expired part-paid"
    >
      <p>
        {view.business.name} received{" "}
        <strong className="text-ink">
          {formatToken(view.amountReceived)} {symbol}
        </strong>{" "}
        of the{" "}
        <strong className="text-ink">
          {formatToken(view.amountDue)} {symbol}
        </strong>{" "}
        due before this checkout ran out.
      </p>
      <p>
        Don&rsquo;t send anything more to this address. Contact{" "}
        {view.business.name} and quote reference{" "}
        <strong className="font-mono text-ink">{view.reference}</strong> to
        complete your order or get a refund.
      </p>
      <ReturnLink href={returnTo} business={view.business.name} />
    </Status>
  );
}

export function ExpiredPanel({
  view,
  returnTo,
}: {
  view: CheckoutView;
  returnTo?: string;
}) {
  return (
    <Status
      tone="neutral"
      icon={<Icon name="clock" className="h-7 w-7" />}
      title="This checkout has expired"
    >
      <p>
        Ask {view.business.name} for a new payment link. Don&rsquo;t send
        anything to an address from this page.
      </p>
      <ReturnLink href={returnTo} business={view.business.name} />
    </Status>
  );
}

export function CancelledPanel({
  view,
  returnTo,
}: {
  view: CheckoutView;
  returnTo?: string;
}) {
  return (
    <Status
      tone="neutral"
      icon={<Icon name="x" className="h-7 w-7" />}
      title="This checkout was cancelled"
    >
      <p>
        {view.business.name} cancelled this payment request. You haven&rsquo;t
        been charged.
      </p>
      <ReturnLink href={returnTo} business={view.business.name} />
    </Status>
  );
}
