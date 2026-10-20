import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="font-serif text-2xl tracking-tight">Ripple</span>
          <span className="hidden text-sm text-ink-muted sm:inline">
            Understand the impact before it happens.
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="text-ink-muted hover:text-ink">
            Overview
          </Link>
          <Link href="/status" className="text-ink-muted hover:text-ink">
            System status
          </Link>
        </nav>
      </div>
    </header>
  );
}
