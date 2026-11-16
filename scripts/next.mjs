/**
 * Runs the Next.js CLI with this app's env files already loaded.
 *
 * Next reads the port from PORT, but only loads `.env` itself after the HTTP
 * server is up — too late to choose the port. Loading the files here first,
 * with Next's own loader and in Next's own order (`.env.local` over `.env`),
 * lets PORT live in `.env` with everything else. A variable already set in the
 * real environment still wins, exactly as it does for Next.
 *
 *   node scripts/next.mjs dev     next dev on $PORT
 *   node scripts/next.mjs start   next start on $PORT
 *
 * Anything after the command is passed through to Next.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import nextEnv from "@next/env";

const DEFAULT_PORT = "3004";

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("Usage: node scripts/next.mjs <dev|start> [next options]");
  process.exit(1);
}

// Quietly: Next says which files it loaded when it starts.
nextEnv.loadEnvConfig(process.cwd(), command === "dev", {
  info: () => undefined,
  error: console.error,
});
process.env.PORT ||= DEFAULT_PORT;

const require = createRequire(import.meta.url);
const next = spawn(
  process.execPath,
  [require.resolve("next/dist/bin/next"), command, ...args],
  { stdio: "inherit" },
);

// Ctrl-C and a platform's shutdown reach Next, and its exit is ours.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => next.kill(signal));
}
next.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
