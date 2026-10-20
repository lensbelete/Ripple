"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return <p className="px-6 py-10 text-sm text-ink-muted">Checking session…</p>;
  }

  if (!user) {
    return null;
  }

  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
}
