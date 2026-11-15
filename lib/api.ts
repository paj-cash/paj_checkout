import { API_URL } from "./config";
import type { CheckoutPayment, CheckoutView } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Nest's error body: `message` is a string, or a list for validation errors. */
function messageOf(body: unknown): string | undefined {
  const message = (body as { message?: unknown } | null)?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(", ");
  return undefined;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    // A checkout changes from second to second; nothing here is cacheable.
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      messageOf(body) ?? `Request failed (${response.status})`,
      response.status,
    );
  }
  return response.json() as Promise<T>;
}

const checkoutPath = (token: string) =>
  `/checkout/${encodeURIComponent(token)}`;

/** Everything the page shows for a checkout. A 404 means the link is bad. */
export const getCheckout = (token: string) =>
  request<CheckoutView>(checkoutPath(token));

/**
 * Starts paying on `chain`, or hands back the payment already waiting there.
 */
export const openAttempt = (token: string, chain: string) =>
  request<CheckoutPayment>(`${checkoutPath(token)}/attempts`, {
    method: "POST",
    body: JSON.stringify({ chain }),
  });
