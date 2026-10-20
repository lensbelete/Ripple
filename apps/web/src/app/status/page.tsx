import type { Metadata } from "next";
import { StatusPanel } from "@/components/dashboard/status-panel";

export const metadata: Metadata = {
  title: "System status",
};

export default function StatusPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-14">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent">
        Operations
      </p>
      <h1 className="mt-3 font-serif text-4xl">System status</h1>
      <p className="mt-4 max-w-2xl text-ink-muted">
        This page queries the NestJS health endpoint. That endpoint probes
        PostgreSQL and the Python simulation service. If a dependency is down,
        the report says so instead of pretending the stack is healthy.
      </p>
      <StatusPanel />
    </section>
  );
}
