"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { useChains } from "@/lib/catalog";
import { formatCountdown } from "@/lib/format";
import type { PaymentOption } from "@/lib/types";
import { ChainMark } from "./ChainMark";
import { Icon, Spinner } from "./ui";

export function ChainPicker({
  options,
  expiresAt,
  now,
  onPick,
  onBack,
}: {
  options: PaymentOption[];
  expiresAt: string;
  now: number;
  onPick: (chain: string) => Promise<void>;
  /** Back to an address already open, when the payer came here from one. */
  onBack?: () => void;
}) {
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const chainOf = useChains();

  async function pick(chain: string) {
    setBusy(chain);
    setError(undefined);
    try {
      await onPick(chain);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "We couldn't start your payment. Check your connection and try again.",
      );
    } finally {
      setBusy(undefined);
    }
  }

  const remaining = new Date(expiresAt).getTime() - now;

  return (
    <div className="space-y-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 inline-flex items-center gap-1 rounded-lg px-1 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50"
        >
          <Icon name="back" className="h-4 w-4" />
          Back to your payment
        </button>
      )}

      <div>
        <h2 className="font-display text-lg font-semibold">
          Which network will you pay on?
        </h2>
        <p className="mt-0.5 text-sm text-muted">
          Choose the network your wallet will send from.
        </p>
      </div>

      {options.length === 0 ? (
        <p className="rounded-xl bg-surface p-4 text-sm text-muted">
          No payment methods are available right now. Please try again later.
        </p>
      ) : (
        <ul className="space-y-2">
          {options.map((option) => (
            <li key={option.chain}>
              <button
                type="button"
                disabled={!!busy}
                onClick={() => pick(option.chain)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-line transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ChainMark chain={option.chain} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {chainOf(option.chain).name}
                  </span>
                  <span className="block text-xs text-muted">
                    {option.anyToken
                      ? `${option.symbol} or any token`
                      : `${option.symbol} only`}
                  </span>
                </span>
                {busy === option.chain ? (
                  <Spinner className="h-4 w-4 text-brand-500" />
                ) : (
                  <Icon name="chevron" className="h-4 w-4 text-faint" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-danger-50 p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      {remaining > 0 && (
        <p className="text-center text-xs text-faint">
          This checkout expires in {formatCountdown(remaining)}
        </p>
      )}
    </div>
  );
}
