import { chainInfo } from "@/lib/chains";

export function ChainMark({
  chain,
  size = "md",
}: {
  chain: string;
  size?: "sm" | "md";
}) {
  const { mark, tone } = chainInfo(chain);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${tone} ${
        size === "sm" ? "h-7 w-7 text-[9px]" : "h-10 w-10 text-[11px]"
      }`}
      aria-hidden="true"
    >
      {mark}
    </span>
  );
}
