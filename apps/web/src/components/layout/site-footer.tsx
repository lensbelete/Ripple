import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Ripple calculates consequences from modeled dependencies, not invented scores.</p>
        <Link href="/status" className="text-accent hover:underline">
          Check live service health
        </Link>
      </div>
    </footer>
  );
}
