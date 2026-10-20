"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { api, ApiError } from "@/lib/api";
import type { AuthUserDto } from "@ripple/shared-types";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api<AuthUserDto>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      await refresh();
      router.push("/workspaces");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to register");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-serif text-4xl">Create an account</h1>
      <p className="mt-3 text-sm text-ink-muted">
        Passwords are hashed on the server. Use at least 10 characters.
      </p>
      <form onSubmit={(event) => void onSubmit(event)} className="mt-8 space-y-4">
        <label className="block text-sm">
          Name
          <Input className="mt-1" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
        </label>
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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={10}
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating account" : "Register"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-ink-muted">
        Already registered?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Log in
        </Link>
      </p>
    </section>
  );
}
