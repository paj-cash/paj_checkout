"use client";

import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { ApiError, getCheckout, getQuote, openAddress } from "./api";
import { API_URL } from "./config";
import { isFinished } from "./screen";
import type {
  CheckoutToken,
  CheckoutView,
  DepositAddress,
  Quote,
} from "./types";

/** How often to re-read the checkout while the live connection is down. */
const POLL_MS = 5000;

/** How often a token's quote is refreshed while the payer looks at it. */
const QUOTE_MS = 30_000;

/** The API's event carrying the whole checkout after any change. */
const UPDATE_EVENT = "CHECKOUT_UPDATE";

/** The time, ticking once a second, for countdowns and expiry. */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * The checkout, kept current.
 *
 * Live updates come over the API's `checkout` socket, authenticated with the
 * page's token in the handshake. Every update is the whole checkout, so each
 * one simply replaces what the page holds. While the socket is down — still
 * connecting, refused, or dropped — the page polls instead, so a payer is
 * never left looking at a stale state. Both stop once nothing more can happen.
 */
export function useCheckout(token: string, initial: CheckoutView, now: number) {
  const [view, setView] = useState(initial);
  const [live, setLive] = useState(false);
  const finished = isFinished(view, now);

  useEffect(() => {
    if (finished) return;
    const socket = io(`${API_URL}/checkout`, { auth: { token } });
    socket.on("connect", () => setLive(true));
    socket.on("disconnect", () => setLive(false));
    socket.on("connect_error", () => setLive(false));
    socket.on(UPDATE_EVENT, (next: CheckoutView) => setView(next));
    return () => {
      socket.disconnect();
      setLive(false);
    };
  }, [token, finished]);

  useEffect(() => {
    if (finished || live) return;
    const id = setInterval(async () => {
      try {
        setView(await getCheckout(token));
      } catch {
        // Try again next tick; the page keeps showing what it has.
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [token, finished, live]);

  /** Gets the address on `chain` for `mint` and shows it straight away. */
  const address = useCallback(
    async (chain: string, mint?: string): Promise<DepositAddress> => {
      const opened = await openAddress(token, chain, mint);
      setView((current) => ({
        ...current,
        depositAddresses: [
          ...current.depositAddresses.filter((a) => a.chain !== opened.chain),
          opened,
        ],
      }));
      return opened;
    },
    [token],
  );

  return { view, live, address };
}

/**
 * What to send of a token to pay `left`, kept current: fetched when the token
 * or what is left changes, and again every {@link QUOTE_MS} as the price
 * moves. The stablecoin needs no asking — it is what is left, one for one.
 */
export function useQuote(
  checkoutToken: string,
  chain: string,
  token: CheckoutToken,
  left: number,
): { quote?: Quote; error?: string; retry: () => void } {
  const [state, setState] = useState<{
    key: string;
    quote?: Quote;
    error?: string;
  }>();
  const [attempt, setAttempt] = useState(0);
  const key = `${chain}:${token.mint}:${left}`;

  useEffect(() => {
    if (token.stable || left <= 0) return;
    let live = true;
    const load = async () => {
      try {
        const quote = await getQuote(checkoutToken, chain, token.mint);
        if (live) setState({ key, quote });
      } catch (err) {
        if (!live) return;
        setState((current) => ({
          key,
          // A refresh that fails keeps the last good figure on screen.
          quote: current?.key === key ? current.quote : undefined,
          error:
            err instanceof ApiError
              ? err.message
              : "We couldn't get a price. Check your connection.",
        }));
      }
    };
    void load();
    const id = setInterval(load, QUOTE_MS);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [checkoutToken, chain, token.mint, token.stable, left, key, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (token.stable) {
    return {
      quote: {
        chain,
        token,
        amount: left,
        amountLeft: left,
        pricePerToken: 1,
        bufferPercent: 0,
        quotedAt: new Date(0).toISOString(),
      },
      retry,
    };
  }
  const current = state?.key === key ? state : undefined;
  return { quote: current?.quote, error: current?.error, retry };
}

/** Copies `text`, and says so for a moment. */
export function useCopy(): [copied: boolean, copy: (text: string) => void] {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = useCallback((text: string) => {
    navigator.clipboard
      ?.writeText(text)
      .then(() => setCopied(true))
      .catch(() => undefined);
  }, []);

  return [copied, copy];
}
