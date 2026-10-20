"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { api, ApiError } from "@/lib/api";
import type { AuthUserDto } from "@ripple/shared-types";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api<AuthUserDto>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await refresh();
      router.push("/workspaces");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to log in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-serif text-4xl">Log in</h1>
      <p className="mt-3 text-sm text-ink-muted">
        Workspaces and models are private to the account that owns them.
      </p>
      <form onSubmit={(event) => void onSubmit(event)} className="mt-8 space-y-4">
        <label className="block text-sm">
          Email
          <Input
            className="mt-1"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Password
          <Input
            className="mt-1"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Signing in" : "Log in"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-ink-muted">
        Need an account?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Register
        </Link>
      </p>
    </section>
  );
}
