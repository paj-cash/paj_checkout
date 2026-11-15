import { Icon, PajMark } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center ring-1 ring-line">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted">
          <Icon name="x" className="h-6 w-6" />
        </span>
        <h1 className="mt-3 font-display text-lg font-semibold">
          This checkout link isn&rsquo;t valid
        </h1>
        <p className="mt-1 text-sm text-muted">
          Check that you opened the whole link, or ask the business that sent
          it for a new one.
        </p>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-faint">
          <PajMark className="h-3.5 w-auto text-brand-500" />
          PAJ Checkout
        </p>
      </div>
    </main>
  );
}
