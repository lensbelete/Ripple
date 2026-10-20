"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { WorkspaceDto } from "@ripple/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setWorkspaces(await api<WorkspaceDto[]>("/workspaces"));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to load workspaces");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const created = await api<WorkspaceDto>("/workspaces", {
        method: "POST",
        body: JSON.stringify({ name, description: description || undefined }),
      });
      setWorkspaces((current) => [created, ...current]);
      setName("");
      setDescription("");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to create workspace");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="font-serif text-4xl">Workspaces</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        A workspace holds the system models you own. Other accounts cannot see these models.
      </p>

      <form onSubmit={(event) => void onCreate(event)} className="mt-8 grid gap-3 border border-line bg-paper-raised p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="text-sm">
          Name
          <Input className="mt-1" value={name} onChange={(event) => setName(event.target.value)} minLength={2} required />
        </label>
        <label className="text-sm">
          Description
          <Input className="mt-1" value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <Button type="submit" disabled={creating}>
          {creating ? "Creating" : "Create workspace"}
        </Button>
      </form>

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      {loading ? (
        <p className="mt-8 text-sm text-ink-muted">Loading workspaces…</p>
      ) : workspaces.length === 0 ? (
        <p className="mt-8 border border-dashed border-line px-4 py-8 text-sm text-ink-muted">
          No workspaces yet. Create one to start modeling a supply chain.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-line border border-line bg-paper-raised">
          {workspaces.map((workspace) => (
            <li key={workspace.id}>
              <Link href={`/workspaces/${workspace.id}`} className="block px-4 py-4 hover:bg-accent-soft/40">
                <p className="font-medium">{workspace.name}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {workspace.description || "No description"} · updated {new Date(workspace.updatedAt).toLocaleString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
