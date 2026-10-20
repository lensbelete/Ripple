"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { SimulationRunDetailDto } from "@ripple/shared-types";
import { api, ApiError } from "@/lib/api";

const ImpactGraph = dynamic(
  () => import("@/components/simulation/impact-graph").then((module) => module.ImpactGraph),
  { ssr: false },
);

export default function SimulationResultsPage() {
  const params = useParams<{ modelId: string; simulationId: string }>();
  const [run, setRun] = useState<SimulationRunDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<SimulationRunDetailDto>(`/simulations/${params.simulationId}`)
      .then((payload) => {
        if (!cancelled) {
          setRun(payload);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof ApiError ? caught.message : "Unable to load simulation");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [params.simulationId]);

  if (error) {
    return <p className="px-6 py-10 text-sm text-danger">{error}</p>;
  }
  if (!run) {
    return <p className="px-6 py-10 text-sm text-ink-muted">Loading simulation…</p>;
  }

  const result = run.result;
  const originNames = run.modifications
    .map((item) => {
      const node = run.modelSnapshot.nodes.find((entry) => entry.id === item.nodeId);
      return `${node?.name ?? item.nodeId}: ${item.field} = ${item.value}`;
    })
    .join("; ");

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href={`/models/${params.modelId}`} className="text-accent hover:underline">
          Graph editor
        </Link>
        <Link href={`/models/${params.modelId}/simulate`} className="text-accent hover:underline">
          New simulation
        </Link>
      </div>
      <h1 className="mt-3 font-serif text-4xl">{run.name}</h1>
      <p className="mt-3 text-ink-muted">
        Horizon {run.horizonDays} days. Snapshot stored at {new Date(run.createdAt).toLocaleString()}. {originNames}
      </p>
      <p className="mt-2 text-xs text-ink-muted">
        Teal outline is the changed node. Amber outline is an affected downstream node. Faded nodes did not change.
      </p>

      <div className="mt-6">
        <ImpactGraph run={run} />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <ResultList
          title="Delayed or short orders"
          empty="No delayed or unfulfilled orders in this scenario."
          items={result.delayedOrders.map(
            (item) =>
              `${item.name}: delay ${item.delayDays} days, shortage ${item.shortageQuantity}, fulfillment day ${item.fulfillmentDay ?? "none"} (due ${item.dueDay})`,
          )}
        />
        <ResultList
          title="Resource shortages"
          empty="No shortages calculated."
          items={result.shortages.map((item) => `${item.name}: short ${item.shortageQuantity} of ${item.quantityRequired}`)}
        />
      </div>

      <ResultList
        title="Constraint violations"
        empty="No constraints were violated."
        items={result.constraintViolations.map((item) => item.message)}
      />

      <h2 className="mt-8 font-serif text-2xl">Affected nodes</h2>
      {result.affectedNodes.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">The modification did not change any calculated node values.</p>
      ) : (
        <div className="mt-3 overflow-x-auto border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-raised text-ink-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Node</th>
                <th className="px-3 py-2 font-medium">Impact</th>
                <th className="px-3 py-2 font-medium">Ready day</th>
                <th className="px-3 py-2 font-medium">Delay</th>
                <th className="px-3 py-2 font-medium">Shortage</th>
              </tr>
            </thead>
            <tbody>
              {result.affectedNodes.map((item) => (
                <tr key={item.nodeId} className="border-t border-line">
                  <td className="px-3 py-2">
                    <p>{item.name}</p>
                    <p className="text-xs text-ink-muted">{item.explanation}</p>
                  </td>
                  <td className="px-3 py-2">{item.impact}</td>
                  <td className="px-3 py-2">
                    {fmt(item.baseline.readyDay)} → {fmt(item.scenario.readyDay)}
                  </td>
                  <td className="px-3 py-2">
                    {item.baseline.delayDays} → {item.scenario.delayDays}
                  </td>
                  <td className="px-3 py-2">
                    {item.baseline.shortageQuantity} → {item.scenario.shortageQuantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-8 font-serif text-2xl">Causal paths</h2>
      {result.causalPaths.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">No downstream causal paths were recorded.</p>
      ) : (
        <ul className="mt-3 space-y-1 text-sm">
          {result.causalPaths.map((path) => (
            <li key={`${path.nodeId}-${path.path.join("-")}`}>{path.pathNames.join(" → ")}</li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 font-serif text-2xl">Costs</h2>
      <p className="mt-3 text-sm">
        Direct cost {fmt(result.costDifference.baselineDirectCost)} → {fmt(result.costDifference.scenarioDirectCost)}.
        Estimated revenue at risk: {fmt(result.costDifference.estimatedRevenueAtRisk)}.
      </p>
      <p className="mt-1 text-sm text-ink-muted">{result.costDifference.note}</p>

      <h2 className="mt-8 font-serif text-2xl">Assumptions</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-muted">
        {result.assumptions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {result.warnings.length > 0 ? (
        <>
          <h2 className="mt-8 font-serif text-2xl">Missing or incomplete data</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-warn">
            {result.warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

function ResultList({ title, empty, items }: { title: string; empty: string; items: string[] }) {
  return (
    <div>
      <h2 className="font-serif text-2xl">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">{empty}</p>
      ) : (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function fmt(value: number | null | undefined) {
  return value === null || value === undefined ? "n/a" : String(value);
}
