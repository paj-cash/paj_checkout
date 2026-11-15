"use client";

import { useEffect } from "react";
import { Button, Icon } from "@/components/ui";

/** The API could not be reached, or answered with something unexpected. */
export default function CheckoutError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center ring-1 ring-line">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-warning-50 text-warning">
          <Icon name="alert" className="h-6 w-6" />
        </span>
        <h1 className="mt-3 font-display text-lg font-semibold">
          We couldn&rsquo;t load this checkout
        </h1>
        <p className="mt-1 text-sm text-muted">
          Check your connection and try again. Nothing has been charged.
        </p>
        <Button className="mt-5 w-full" onClick={() => retry()}>
          Try again
        </Button>
      </div>
    </main>
  );
}
