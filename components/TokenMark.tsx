"use client";

import { useTokenLogo } from "@/lib/catalog";
import { Logo } from "./Logo";

const SIZES = {
  sm: "h-7 w-7 text-[8px]",
  md: "h-10 w-10 text-[11px]",
};

/**
 * A token's logo from GET /chain/token, or its symbol's first letters while
 * it loads, when it has none, or when it shouldn't be trusted (see
 * `useTokenLogo`).
 */
export function TokenMark({
  chain,
  token,
  size = "md",
}: {
  chain: string;
  token: { mint: string; symbol: string; stable: boolean; native: boolean };
  size?: keyof typeof SIZES;
}) {
  const logo = useTokenLogo(chain, token);
  return (
    <Logo
      src={logo}
      className={SIZES[size]}
      fallback={
        <span
          className={`inline-flex shrink-0 items-center justify-center rounded-full bg-surface font-semibold text-ink-soft ring-1 ring-line ${SIZES[size]}`}
          aria-hidden="true"
        >
          {token.symbol.slice(0, 4).toUpperCase()}
        </span>
      }
    />
  );
}
