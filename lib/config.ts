/**
 * The PAJ API this page reads from and writes to. One variable serves the
 * server render and the browser, so both always talk to the same API.
 */
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");
