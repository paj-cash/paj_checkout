"use client";

import { useState, type ReactNode } from "react";

/**
 * A chain or token logo from wherever its metadata source keeps it, or
 * `fallback` when there is none or it won't load: gone, not https (the CSP
 * only takes https images), or refused by its host. The page sends no
 * Referer, so the host never sees the checkout's link.
 */
export function Logo({
  src,
  className,
  fallback,
}: {
  src?: string;
  className: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState<string>();
  if (!src || failed === src) return fallback;
  return (
    // A plain <img>: logos come from hosts this page can't list in advance,
    // which next/image would need.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={`shrink-0 rounded-full bg-white object-cover ${className}`}
      referrerPolicy="no-referrer"
      decoding="async"
      onError={() => setFailed(src)}
    />
  );
}
