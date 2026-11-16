"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, getTokens } from "@/lib/api";
import { chainInfo } from "@/lib/chains";
import type { SuggestedToken } from "@/lib/types";
import { ChainMark } from "./ChainMark";
import { Button, Icon, Spinner } from "./ui";

/** A token's mark: its symbol's first letters, drawn here, never fetched. */
function TokenMark({ symbol }: { symbol: string }) {
  return (
    <span
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface font-semibold text-[11px] text-ink-soft ring-1 ring-line"
      aria-hidden="true"
    >
      {symbol.slice(0, 4).toUpperCase()}
    </span>
  );
}

/** "Stablecoin", "Native coin", or nothing, under a token's name. */
function kindOf(token: SuggestedToken): string | undefined {
  if (token.stable) return "Stablecoin · counted one for one";
  if (token.native) return "Native coin";
  return undefined;
}

/**
 * Second step: which token on the chosen network. Offers the network's
 * stablecoin, its own coin and a few popular tokens, and takes any other
 * token's address pasted in. The API checks a token can be priced before the
 * address will take it, so a pick that can't be paid with is refused here,
 * before the payer sends anything.
 */
export function TokenPicker({
  checkoutToken,
  chain,
  onPick,
  onBack,
}: {
  checkoutToken: string;
  chain: string;
  onPick: (mint: string) => Promise<void>;
  onBack: () => void;
}) {
  const [tokens, setTokens] = useState<SuggestedToken[]>();
  const [loadError, setLoadError] = useState<string>();
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [pasted, setPasted] = useState("");
  const network = chainInfo(chain).name;

  useEffect(() => {
    let live = true;
    getTokens(checkoutToken, chain)
      .then((list) => live && setTokens(list))
      .catch((err) => {
        if (!live) return;
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "We couldn't load the tokens. Check your connection.",
        );
      });
    return () => {
      live = false;
    };
  }, [checkoutToken, chain]);

  async function pick(mint: string) {
    setBusy(mint);
    setError(undefined);
    try {
      await onPick(mint);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "We couldn't set up that token. Check your connection and try again.",
      );
    } finally {
      setBusy(undefined);
    }
  }

  function submitPasted(event: FormEvent) {
    event.preventDefault();
    const mint = pasted.trim();
    if (mint) void pick(mint);
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="-ml-1 inline-flex items-center gap-1 rounded-lg px-1 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50"
      >
        <Icon name="back" className="h-4 w-4" />
        Change network
      </button>

      <div className="flex items-center gap-3">
        <ChainMark chain={chain} size="sm" />
        <div>
          <h2 className="font-display text-lg font-semibold">
            Which token will you pay with?
          </h2>
          <p className="text-sm text-muted">On {network}</p>
        </div>
      </div>

      {!tokens && !loadError && (
        <div className="flex justify-center py-6">
          <Spinner className="h-5 w-5 text-brand-500" />
        </div>
      )}
      {loadError && (
        <p
          role="alert"
          className="rounded-xl bg-danger-50 p-3 text-sm text-danger"
        >
          {loadError}
        </p>
      )}

      {tokens && (
        <ul className="space-y-2">
          {tokens.map((token) => (
            <li key={token.mint}>
              <button
                type="button"
                disabled={!!busy}
                onClick={() => pick(token.mint)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-line transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <TokenMark symbol={token.symbol} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {token.symbol}{" "}
                    <span className="font-normal text-muted">{token.name}</span>
                  </span>
                  {kindOf(token) && (
                    <span className="block text-xs text-muted">
                      {kindOf(token)}
                    </span>
                  )}
                </span>
                {busy === token.mint ? (
                  <Spinner className="h-4 w-4 text-brand-500" />
                ) : (
                  <Icon name="chevron" className="h-4 w-4 text-faint" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {tokens && tokens.length > 1 && (
        <form onSubmit={submitPasted} className="space-y-2">
          <label
            htmlFor="token-address"
            className="block text-xs font-medium text-muted"
          >
            Paying with something else? Paste its token address on {network}
          </label>
          <div className="flex gap-2">
            <input
              id="token-address"
              value={pasted}
              onChange={(event) => setPasted(event.target.value)}
              placeholder="Token address"
              autoComplete="off"
              spellCheck={false}
              className="min-h-11 min-w-0 flex-1 rounded-xl bg-white px-3 font-mono text-sm ring-1 ring-line placeholder:font-sans placeholder:text-faint focus:outline-2 focus:outline-brand-500"
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={!!busy || !pasted.trim()}
            >
              {busy === pasted.trim() ? <Spinner className="h-4 w-4" /> : "Use"}
            </Button>
          </div>
        </form>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-danger-50 p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      {tokens && tokens.length > 1 && (
        <p className="text-xs text-muted">
          Tokens other than the stablecoin are converted when they arrive, and
          count for what the conversion produces.
        </p>
      )}
    </div>
  );
}
