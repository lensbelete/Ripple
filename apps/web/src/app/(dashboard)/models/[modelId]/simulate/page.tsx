"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { SimulationRunDetailDto, SimulationRunDto, SystemModelGraphDto } from "@ripple/shared-types";
import { NODE_TYPE_LABELS } from "@ripple/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NODE_FIELD_LABELS } from "@/lib/node-fields";
import { api, ApiError } from "@/lib/api";

export default function SimulatePage() {
  const params = useParams<{ modelId: string }>();
  const router = useRouter();
  const [model, setModel] = useState<SystemModelGraphDto | null>(null);
  const [runs, setRuns] = useState<SimulationRunDto[]>([]);
  const [nodeId, setNodeId] = useState("");
  const [field, setField] = useState("");
  const [value, setValue] = useState("");
  const [horizonDays, setHorizonDays] = useState("90");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [graph, history] = await Promise.all([
          api<SystemModelGraphDto>(`/models/${params.modelId}`),
          api<SimulationRunDto[]>(`/models/${params.modelId}/simulations`),
        ]);
        if (cancelled) {
          return;
        }
        setModel(graph);
        setRuns(history);
        const supplier = graph.nodes.find((node) => node.type === "supplier");
        const initial = supplier ?? graph.nodes[0];
        if (initial) {
          setNodeId(initial.id);
          const fields = Object.keys(NODE_FIELD_LABELS[initial.type]);
          setField(fields[0] ?? "");
          const current = (initial.config as unknown as Record<string, number>)[fields[0]];
          setValue(current === undefined ? "" : String(current));
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof ApiError ? caught.message : "Unable to load model");
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.modelId]);

  const selected = model?.nodes.find((node) => node.id === nodeId);
  const fields = useMemo(() => (selected ? Object.entries(NODE_FIELD_LABELS[selected.type]) : []), [selected]);

  function onSelectNode(nextId: string) {
    setNodeId(nextId);
    const node = model?.nodes.find((item) => item.id === nextId);
    if (!node) {
      return;
    }
    const nextFields = Object.keys(NODE_FIELD_LABELS[node.type]);
    setField(nextFields[0] ?? "");
    const current = (node.config as unknown as Record<string, number>)[nextFields[0]];
    setValue(current === undefined ? "" : String(current));
  }

  async function onRun(event: FormEvent) {
    event.preventDefault();
    setRunning(true);
    setError(null);
    try {
      const run = await api<SimulationRunDetailDto>(`/models/${params.modelId}/simulate`, {
        method: "POST",
        body: JSON.stringify({
          name: name || undefined,
          horizonDays: Number(horizonDays),
          modifications: nodeId && field ? [{ nodeId, field, value: Number(value) }] : [],
        }),
      });
      router.push(`/models/${params.modelId}/simulations/${run.id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Simulation failed");
    } finally {
      setRunning(false);
    }
  }

  if (!model) {
    return <p className="px-6 py-10 text-sm text-ink-muted">{error ?? "Loading model…"}</p>;
  }

  const currentValue =
    selected && field ? (selected.config as unknown as Record<string, number>)[field] : undefined;

  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-10">
      <Link href={`/models/${model.id}`} className="text-sm text-accent hover:underline">
        Back to graph editor
      </Link>
      <h1 className="mt-3 font-serif text-4xl">Simulate a change</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        The engine copies this saved model, applies the modification to the copy, and
        compares it with the unmodified baseline. The live model is not edited.
      </p>

      <form onSubmit={(event) => void onRun(event)} className="mt-8 space-y-4 border border-line bg-paper-raised p-4">
        <label className="block text-sm">
          Node
          <select
            className="mt-1 w-full border border-line bg-paper-raised px-3 py-2 text-sm"
            value={nodeId}
            onChange={(event) => onSelectNode(event.target.value)}
          >
            {model.nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name} ({NODE_TYPE_LABELS[node.type]})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Field
          <select
            className="mt-1 w-full border border-line bg-paper-raised px-3 py-2 text-sm"
            value={field}
            onChange={(event) => {
              setField(event.target.value);
              if (selected) {
                const current = (selected.config as unknown as Record<string, number>)[event.target.value];
                setValue(current === undefined ? "" : String(current));
              }
            }}
          >
            {fields.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          New value {currentValue === undefined ? "" : `(currently ${currentValue})`}
          <Input className="mt-1" type="number" step="any" value={value} onChange={(event) => setValue(event.target.value)} required />
        </label>
        <label className="block text-sm">
          Horizon (days)
          <Input className="mt-1" type="number" min={1} max={3650} value={horizonDays} onChange={(event) => setHorizonDays(event.target.value)} required />
        </label>
        <label className="block text-sm">
          Run name
          <Input className="mt-1" value={name} onChange={(event) => setName(event.target.value)} placeholder="Supplier A delayed 14 days" />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" disabled={running || model.nodes.length === 0}>
          {running ? "Running simulation" : "Run simulation"}
        </Button>
      </form>

      <h2 className="mt-10 font-serif text-2xl">Previous runs</h2>
      {runs.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">No simulations stored for this model yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line border border-line bg-paper-raised">
          {runs.map((run) => (
            <li key={run.id}>
              <Link href={`/models/${model.id}/simulations/${run.id}`} className="block px-4 py-3 hover:bg-accent-soft/40">
                <p className="font-medium">{run.name}</p>
                <p className="text-sm text-ink-muted">
                  {new Date(run.createdAt).toLocaleString()} · {run.result.affectedNodes.length} affected nodes ·{" "}
                  {run.result.delayedOrders.length} delayed or short orders
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
