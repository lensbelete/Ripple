"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import type { SystemModelDto, WorkspaceDto } from "@ripple/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";

export default function WorkspaceModelsPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const [workspace, setWorkspace] = useState<WorkspaceDto | null>(null);
  const [models, setModels] = useState<SystemModelDto[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [workspaceResult, modelsResult] = await Promise.all([
          api<WorkspaceDto>(`/workspaces/${workspaceId}`),
          api<SystemModelDto[]>(`/workspaces/${workspaceId}/models`),
        ]);
        if (!cancelled) {
          setWorkspace(workspaceResult);
          setModels(modelsResult);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof ApiError ? caught.message : "Unable to load workspace");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const created = await api<SystemModelDto>(`/workspaces/${workspaceId}/models`, {
        method: "POST",
        body: JSON.stringify({ name, description: description || undefined }),
      });
      setModels((current) => [created, ...current]);
      setName("");
      setDescription("");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to create model");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-10">
      <Link href="/workspaces" className="text-sm text-accent hover:underline">
        Back to workspaces
      </Link>
      <h1 className="mt-3 font-serif text-4xl">{workspace?.name ?? "Workspace"}</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        {workspace?.description || "Create a system model, then open the graph editor to add nodes and dependencies."}
      </p>

      <form onSubmit={(event) => void onCreate(event)} className="mt-8 grid gap-3 border border-line bg-paper-raised p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="text-sm">
          Model name
          <Input className="mt-1" value={name} onChange={(event) => setName(event.target.value)} minLength={2} required />
        </label>
        <label className="text-sm">
          Description
          <Input className="mt-1" value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <Button type="submit" disabled={creating}>
          {creating ? "Creating" : "Create model"}
        </Button>
      </form>

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      {loading ? (
        <p className="mt-8 text-sm text-ink-muted">Loading models…</p>
      ) : models.length === 0 ? (
        <p className="mt-8 border border-dashed border-line px-4 py-8 text-sm text-ink-muted">
          This workspace has no models yet.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-line border border-line bg-paper-raised">
          {models.map((model) => (
            <li key={model.id}>
              <Link href={`/models/${model.id}`} className="block px-4 py-4 hover:bg-accent-soft/40">
                <p className="font-medium">{model.name}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Time unit: {model.timeUnit} · {model.description || "No description"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
