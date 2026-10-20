import Link from "next/link";
import { ArrowRight, GitBranch, Scale, Waypoints } from "lucide-react";
import { SupplyChainPreview } from "@/components/graphs/supply-chain-preview";

const steps = [
  {
    title: "Model the system",
    body: "Describe suppliers, inventory, production, orders, and the directed dependencies between them.",
    icon: GitBranch,
  },
  {
    title: "Introduce a change",
    body: "Ask a concrete question: what happens if a supplier is delayed, capacity falls, or demand rises.",
    icon: Waypoints,
  },
  {
    title: "Read the consequences",
    body: "Ripple recalculates timing, shortages, and constraints, then explains the causal path for each result.",
    icon: Scale,
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent">
            Decision intelligence
          </p>
          <h1 className="mt-4 max-w-xl font-serif text-5xl leading-tight text-ink sm:text-6xl">
            Understand the impact before it happens.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink-muted">
            Ripple models an operational system as a dependency graph. When one
            part changes, the engine calculates what breaks, what is delayed, and
            why — from the model you defined, not from guessed scores.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-accent px-4 py-2 text-sm font-medium text-paper-raised hover:bg-[#173c3a]"
            >
              Create an account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/workspaces"
              className="inline-flex items-center gap-2 border border-line bg-paper-raised px-4 py-2 text-sm font-medium text-ink hover:border-ink"
            >
              Open workspaces
            </Link>
          </div>
        </div>
        <SupplyChainPreview />
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.title}>
              <step.icon className="h-5 w-5 text-accent" aria-hidden="true" />
              <h2 className="mt-4 font-serif text-2xl">{step.title}</h2>
              <p className="mt-3 text-sm leading-6 text-ink-muted">{step.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
