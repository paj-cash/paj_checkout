/**
 * How each chain is shown to a payer. Kept here rather than fetched: the page
 * loads nothing from anywhere but its own origin and the PAJ API, so chain
 * marks are drawn locally instead of pulled from a logo CDN.
 */
interface ChainInfo {
  name: string;
  /** Two or three letters for the chain's mark. */
  mark: string;
  /** Tailwind classes for the mark's colours. */
  tone: string;
}

const CHAINS: Record<string, ChainInfo> = {
  SOLANA: { name: "Solana", mark: "SOL", tone: "bg-[#14151a] text-[#14f195]" },
  ETHEREUM: {
    name: "Ethereum",
    mark: "ETH",
    tone: "bg-[#ecf0fe] text-[#4a5ee8]",
  },
  BASE: { name: "Base", mark: "B", tone: "bg-[#0052ff] text-white" },
  BSC: {
    name: "BNB Smart Chain",
    mark: "BNB",
    tone: "bg-[#fdf6e0] text-[#c99400]",
  },
  MONAD: { name: "Monad", mark: "MON", tone: "bg-[#ede9fe] text-[#6e54ff]" },
  ARC: { name: "Arc", mark: "ARC", tone: "bg-[#eaf2ff] text-[#1b4ed8]" },
  ROBINHOOD: {
    name: "Robinhood Chain",
    mark: "HD",
    tone: "bg-[#e9fbd8] text-[#2d6a00]",
  },
  TON: { name: "TON", mark: "TON", tone: "bg-[#e6f4ff] text-[#0088cc]" },
  SUI: { name: "Sui", mark: "SUI", tone: "bg-[#e8f4ff] text-[#2f8cff]" },
  NEAR: { name: "NEAR", mark: "N", tone: "bg-[#111111] text-white" },
};

/** A chain the page has no entry for still renders, under its own name. */
export function chainInfo(chain: string): ChainInfo {
  return (
    CHAINS[chain] ?? {
      name: chain.charAt(0) + chain.slice(1).toLowerCase(),
      mark: chain.slice(0, 3),
      tone: "bg-surface text-ink-soft",
    }
  );
}

/**
 * What the QR code holds. On Solana it is a Solana Pay link, which wallets
 * open with the token and amount already filled in. Elsewhere it is the bare
 * address: every wallet can scan that, while the payment-link formats for the
 * other chains are supported unevenly enough that one could prefill the wrong
 * token or amount. The page always shows the amount beside the code.
 */
export function paymentUri(
  chain: string,
  address: string,
  token: { mint: string; native: boolean },
  amount: number,
): string {
  if (chain === "SOLANA") {
    const params = new URLSearchParams({
      amount: amount.toLocaleString("en-US", {
        useGrouping: false,
        maximumFractionDigits: 9,
      }),
      // Native SOL is named by leaving the token out.
      ...(token.native ? {} : { "spl-token": token.mint }),
      label: "PAJ Checkout",
    });
    return `solana:${address}?${params.toString()}`;
  }
  return address;
}

/** Whether two spellings name one token. EVM addresses ignore case. */
export function sameMint(chain: string, a: string, b: string): boolean {
  return chain === "SOLANA" ? a === b : a.toLowerCase() === b.toLowerCase();
}
