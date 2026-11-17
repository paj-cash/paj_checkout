"use client";

import { useEffect, useState } from "react";
import { getChainToken, getChains } from "./api";
import { chainInfo, type ChainInfo } from "./chains";
import type { ChainMeta, ChainTokenInfo } from "./types";

/*
 * Chain and token names and logos, from GET /chain/chains and GET /chain/token.
 * Neither changes during a visit, so each is asked for once per page load and
 * shared by every component that shows it. A request that fails is not
 * remembered: the page shows the letter marks from ./chains and asks again
 * the next time something needs it.
 */

let chains: Record<string, ChainMeta> | undefined;
let loadingChains: Promise<Record<string, ChainMeta>> | undefined;

function loadChains(): Promise<Record<string, ChainMeta>> {
  loadingChains ??= getChains().then(
    (list) => (chains = Object.fromEntries(list.map((c) => [c.chain, c]))),
    () => {
      loadingChains = undefined;
      return {};
    },
  );
  return loadingChains;
}

const tokens = new Map<string, ChainTokenInfo>();
const loadingTokens = new Map<string, Promise<ChainTokenInfo | null>>();

const tokenKey = (chain: string, mint: string) => `${chain}:${mint}`;

function loadToken(chain: string, mint: string): Promise<ChainTokenInfo | null> {
  const key = tokenKey(chain, mint);
  let info = loadingTokens.get(key);
  if (!info) {
    info = getChainToken(chain, mint).then(
      (found) => {
        tokens.set(key, found);
        return found;
      },
      () => {
        loadingTokens.delete(key);
        return null;
      },
    );
    loadingTokens.set(key, info);
  }
  return info;
}

/** How a chain is shown: the API's name and logo over the local letter mark. */
export interface ChainDisplay extends ChainInfo {
  logo?: string;
}

/**
 * A lookup from chain to how it is shown. Starts with the local names and
 * letter marks, and switches to the API's once GET /chain/chains answers.
 */
export function useChains(): (chain: string) => ChainDisplay {
  const [known, setKnown] = useState(chains);
  useEffect(() => {
    if (known) return;
    let live = true;
    loadChains().then((all) => live && setKnown(all));
    return () => {
      live = false;
    };
  }, [known]);
  return (chain) => {
    const local = chainInfo(chain);
    const meta = known?.[chain];
    return {
      ...local,
      name: meta?.name ?? local.name,
      logo: meta?.logo ?? undefined,
    };
  };
}

/**
 * A token's logo, or nothing while it loads or when it shouldn't be shown.
 *
 * A token's logo is a URL its creator chose, so a token anyone can mint could
 * wear USDC's. Where the chain's source says it does not vouch for a token
 * (Jupiter, TonAPI), the payer sees its letters instead. The stablecoin and
 * native coins are ours to name and always get theirs, and a native coin the
 * source has no image for (TON) wears its chain's logo, which is the coin's.
 */
export function useTokenLogo(
  chain: string,
  token: { mint: string; stable: boolean; native: boolean },
): string | undefined {
  const key = tokenKey(chain, token.mint);
  const [loaded, setLoaded] = useState<{
    key: string;
    info: ChainTokenInfo | null;
  }>();
  const chainLogo = useChains()(chain).logo;

  useEffect(() => {
    if (tokens.has(key)) return;
    let live = true;
    loadToken(chain, token.mint).then((info) => live && setLoaded({ key, info }));
    return () => {
      live = false;
    };
  }, [chain, token.mint, key]);

  const info = tokens.get(key) ?? (loaded?.key === key ? loaded.info : undefined);
  // Still loading: letters, rather than a chain logo that is then swapped.
  if (info === undefined) return undefined;
  const ours = token.stable || token.native;
  if (info?.verified === false && !ours) return undefined;
  return info?.image ?? (token.native ? chainLogo : undefined);
}
