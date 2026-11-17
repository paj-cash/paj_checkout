"use client";

import { useChains } from "@/lib/catalog";
import { Logo } from "./Logo";

const SIZES = {
  xs: "h-4 w-4 text-[7px]",
  sm: "h-7 w-7 text-[9px]",
  md: "h-10 w-10 text-[11px]",
};

/** A chain's logo from GET /chain/chains, or its letters until it loads. */
export function ChainMark({
  chain,
  size = "md",
}: {
  chain: string;
  size?: keyof typeof SIZES;
}) {
  const { mark, tone, logo } = useChains()(chain);
  return (
    <Logo
      src={logo}
      className={SIZES[size]}
      fallback={
        <span
          className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${tone} ${SIZES[size]}`}
          aria-hidden="true"
        >
          {size === "xs" ? mark.charAt(0) : mark}
        </span>
      }
    />
  );
}
