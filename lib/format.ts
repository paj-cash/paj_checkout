import type { Currency } from "./types";

const priceFormats: Record<Currency, Intl.NumberFormat> = {
  NGN: new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }),
  USD: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }),
};

/** ₦2,500.00 or $25.00: the price as the business set it. */
export const formatPrice = (amount: number, currency: Currency) =>
  priceFormats[currency].format(amount);

/**
 * A token's dollar price: cents for anything over a dollar, enough
 * significant digits to mean something for the tokens worth a fraction of a
 * cent. $160.42, $0.6512, $0.00002134.
 */
export const formatUsdPrice = (price: number) =>
  price >= 1
    ? priceFormats.USD.format(price)
    : price.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumSignificantDigits: 4,
      });

/**
 * A token amount exactly as it must be sent: every significant digit, no
 * rounding and no trailing zeros. 1.7069 stays 1.7069, 25 stays 25.
 */
export const formatToken = (amount: number) =>
  amount.toLocaleString("en-US", {
    useGrouping: false,
    maximumFractionDigits: 18,
  });

/** 29:59, or 1:04:12 past an hour. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}
