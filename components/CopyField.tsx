"use client";

import type { ReactNode } from "react";
import { useCopy } from "@/lib/hooks";
import { Icon } from "./ui";

/**
 * A value the payer has to get exactly right — an amount, an address — with a
 * button that copies it. What is copied is `value` alone, never the label or
 * the token symbol beside it, so it pastes straight into a wallet.
 */
export function CopyField({
  label,
  value,
  display,
  large = false,
}: {
  label: string;
  value: string;
  /** What to show, when it differs from what is copied. */
  display?: ReactNode;
  large?: boolean;
}) {
  const [copied, copy] = useCopy();

  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="mb-1 text-xs font-medium text-muted">{label}</div>
      <div className="flex items-start gap-3">
        <div
          className={`min-w-0 flex-1 break-all font-mono ${
            large ? "text-2xl font-semibold tracking-tight" : "text-sm"
          }`}
        >
          {display ?? value}
        </div>
        <button
          type="button"
          onClick={() => copy(value)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-brand-600 ring-1 ring-line hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-500"
          aria-label={`Copy ${label.toLowerCase()}`}
        >
          <Icon name={copied ? "check" : "copy"} className="h-3.5 w-3.5" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
