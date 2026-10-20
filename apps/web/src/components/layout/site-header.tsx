"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await logout();
    if (pathname.startsWith("/workspaces") || pathname.startsWith("/models")) {
      router.push("/login");
    }
  }

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
          <Link href="/status" className="text-ink-muted hover:text-ink">
            System status
          </Link>
          <Link href="/workspaces" className="text-ink-muted hover:text-ink">
            Workspaces
          </Link>
          {loading ? null : user ? (
            <>
              <span className="hidden text-ink-muted md:inline">{user.email}</span>
              <button type="button" onClick={() => void handleLogout()} className="text-ink-muted hover:text-ink">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-ink-muted hover:text-ink">
                Log in
              </Link>
              <Link href="/register" className="text-accent hover:underline">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
