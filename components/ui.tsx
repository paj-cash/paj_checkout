import type { ButtonHTMLAttributes, ReactNode } from "react";

/** The PAJ mark, from paj_webapp's logo.svg, tinted with `currentColor`. */
export function PajMark({ className = "h-4 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 45"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M53.0136 9.8155H57.5419L57.3429 10.5071C55.164 18.2279 54.4535 26.972 52.1231 34.5792C49.641 42.6979 43.6538 45.8052 35.8003 41.9211L36.9276 38.1222C45.4348 42.2716 47.7274 36.2086 49.1484 29.113C45.7285 30.6003 41.7022 30.1172 39.8928 26.5362C33.5077 32.7413 24.3184 29.7098 26.791 19.9426L24.7826 20.4258C24.6405 25.2478 22.2153 33.2718 16.0102 32.2582C12.145 31.6234 12.7702 26.5362 13.945 23.912C15.0439 21.4584 18.028 18.9953 20.368 17.7637C19.4396 11.4355 14.0492 12.6386 11.5955 17.2238L5.06831 44.3937L1.06103 43.3516L7.81562 15.5185C5.75987 12.0512 4.02623 14.9501 3.12625 17.3659L0 15.9259C1.47786 10.5828 6.2146 7.41871 10.7619 12.0512C15.8112 7.39029 23.0205 9.18077 24.4795 16.0964L28.3636 15.5659C30.6846 10.6586 38.6991 6.41452 43.2843 10.7723C47.6326 14.8933 41.1054 22.5763 44.0138 25.3236C47.5284 28.6488 50.6736 20.5774 51.3178 18.3416C52.0852 15.6891 52.6915 12.4775 53.0041 9.8155H53.0136ZM37.695 13.0744C33.1951 13.548 28.572 21.1458 31.1014 24.8878C33.4414 28.3551 37.8465 23.2299 38.9928 20.6437C39.4002 19.7342 40.7833 14.988 40.6223 14.2396C40.1012 13.1312 38.7465 12.9512 37.6855 13.0649L37.695 13.0744ZM20.6901 22.3584C19.2027 22.3584 15.9344 27.6446 17.3175 28.4025C19.2312 29.0845 20.9648 22.6615 20.6901 22.3584Z" />
      <path d="M59.2454 4.28571C59.4882 2.2966 58.4305 0.530943 56.8828 0.342011C55.3351 0.153078 53.8837 1.61241 53.6408 3.60152C53.398 5.59063 54.4558 7.35629 56.0035 7.54522C57.5511 7.73415 59.0026 6.27482 59.2454 4.28571Z" />
    </svg>
  );
}

type IconName =
  | "check"
  | "clock"
  | "alert"
  | "copy"
  | "lock"
  | "back"
  | "chevron"
  | "x";

const ICON_PATHS: Record<IconName, ReactNode> = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4.5M12 17.2v.3" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5V6a1.5 1.5 0 00-1.5-1.5H6A1.5 1.5 0 004.5 6v8A1.5 1.5 0 006 15.5h2.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V8a4 4 0 018 0v2.5" />
    </>
  ),
  back: <path d="M14.5 6l-6 6 6 6" />,
  chevron: <path d="M9.5 6l6 6-6 6" />,
  x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
};

export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`animate-spin ${className}`}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 00-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

const BUTTON_STYLES = {
  primary:
    "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-200",
  secondary:
    "bg-white text-ink ring-1 ring-line hover:bg-surface active:bg-line/60 disabled:text-faint",
  ghost: "text-brand-600 hover:bg-brand-50 active:bg-brand-100",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_STYLES;
}) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed ${BUTTON_STYLES[variant]} ${className}`}
      {...props}
    />
  );
}

/** A link styled as a button, for leaving the page. */
export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof BUTTON_STYLES;
}) {
  return (
    <a
      href={href}
      rel="noreferrer"
      className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${BUTTON_STYLES[variant]}`}
    >
      {children}
    </a>
  );
}
