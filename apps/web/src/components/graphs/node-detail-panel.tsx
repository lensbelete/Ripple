import {
  DEPENDENCY_TYPE_LABELS,
  DEPENDENCY_TYPES,
  NODE_TYPE_LABELS,
  type DependencyType,
  type NodeConfig,
  type NodeType,
} from "@ripple/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NODE_FIELD_LABELS } from "@/lib/node-fields";
import type { SystemFlowNode } from "./system-node";
import type { Edge } from "@xyflow/react";

interface NodeDetailPanelProps {
  selectedNode: SystemFlowNode | null;
  selectedEdge: Edge | null;
  onChangeNode: (nodeId: string, patch: { name?: string; config?: NodeConfig }) => void;
  onChangeEdge: (
    edgeId: string,
    patch: { type?: DependencyType; quantity?: number | null; unit?: string | null; leadTimeDays?: number | null },
  ) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
}

export function NodeDetailPanel({
  selectedNode,
  selectedEdge,
  onChangeNode,
  onChangeEdge,
  onDeleteNode,
  onDeleteEdge,
}: NodeDetailPanelProps) {
  if (selectedNode) {
    const type = selectedNode.data.nodeType;
    const config = selectedNode.data.config;
    const fields = NODE_FIELD_LABELS[type];

    return (
      <aside className="flex h-full w-full flex-col border-l border-line bg-paper-raised">
        <div className="border-b border-line px-4 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">{NODE_TYPE_LABELS[type]}</p>
          <h2 className="mt-1 font-serif text-2xl">Node</h2>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <label className="block text-sm">
            Name
            <Input
              className="mt-1"
              value={selectedNode.data.name}
              onChange={(event) => onChangeNode(selectedNode.id, { name: event.target.value })}
            />
          </label>
          {Object.entries(fields).map(([key, label]) => (
            <label key={key} className="block text-sm">
              {label}
              <Input
                className="mt-1"
                type="number"
                step="any"
                value={String((config as unknown as Record<string, number>)[key] ?? "")}
                onChange={(event) =>
                  onChangeNode(selectedNode.id, {
                    config: {
                      ...config,
                      [key]: event.target.value === "" ? 0 : Number(event.target.value),
                    },
                  })
                }
              />
            </label>
          ))}
        </div>
        <div className="border-t border-line px-4 py-3">
          <Button variant="secondary" onClick={() => onDeleteNode(selectedNode.id)}>
            Remove node
          </Button>
        </div>
      </aside>
    );
  }

  if (selectedEdge) {
    return (
      <aside className="flex h-full w-full flex-col border-l border-line bg-paper-raised">
        <div className="border-b border-line px-4 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">Dependency</p>
          <h2 className="mt-1 font-serif text-2xl">Edge</h2>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <label className="block text-sm">
            Type
            <select
              className="mt-1 w-full border border-line bg-paper-raised px-3 py-2 text-sm"
              value={(selectedEdge.data?.type as string) ?? "production_input"}
              onChange={(event) => onChangeEdge(selectedEdge.id, { type: event.target.value as DependencyType })}
            >
              {DEPENDENCY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DEPENDENCY_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Quantity
            <Input
              className="mt-1"
              type="number"
              step="any"
              value={typeof selectedEdge.data?.quantity === "number" ? selectedEdge.data.quantity : ""}
              onChange={(event) =>
                onChangeEdge(selectedEdge.id, {
                  quantity: event.target.value === "" ? null : Number(event.target.value),
                })
              }
            />
          </label>
          <label className="block text-sm">
            Unit
            <Input
              className="mt-1"
              value={(selectedEdge.data?.unit as string) ?? ""}
              onChange={(event) => onChangeEdge(selectedEdge.id, { unit: event.target.value || null })}
            />
          </label>
          <label className="block text-sm">
            Lead time (days)
            <Input
              className="mt-1"
              type="number"
              step="any"
              value={typeof selectedEdge.data?.leadTimeDays === "number" ? selectedEdge.data.leadTimeDays : ""}
              onChange={(event) =>
                onChangeEdge(selectedEdge.id, {
                  leadTimeDays: event.target.value === "" ? null : Number(event.target.value),
                })
              }
            />
          </label>
        </div>
        <div className="border-t border-line px-4 py-3">
          <Button variant="secondary" onClick={() => onDeleteEdge(selectedEdge.id)}>
            Remove dependency
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-full flex-col border-l border-line bg-paper-raised px-4 py-4 text-sm text-ink-muted">
      <h2 className="font-serif text-2xl text-ink">Inspector</h2>
      <p className="mt-3">
        Select a node to edit its type-specific fields, or select a dependency to change quantity and timing.
      </p>
    </aside>
  );
}

export type { NodeType };
