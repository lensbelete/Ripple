"use client";

import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  NODE_TYPE_LABELS,
  NODE_TYPES,
  defaultNodeConfig,
  type GraphValidationResult,
  type NodeType,
  type SystemModelGraphDto,
} from "@ripple/shared-types";
import { Button } from "@/components/ui/button";
import { inferDependencyType } from "@/lib/dependency-inference";
import { api, ApiError } from "@/lib/api";
import { NodeDetailPanel } from "./node-detail-panel";
import { SystemNode, type SystemFlowNode } from "./system-node";

const nodeTypes: NodeTypes = { system: SystemNode };

interface ModelEditorProps {
  modelId: string;
}

export function ModelEditor({ modelId }: ModelEditorProps) {
  return (
    <ReactFlowProvider>
      <ModelEditorCanvas modelId={modelId} />
    </ReactFlowProvider>
  );
}

function ModelEditorCanvas({ modelId }: ModelEditorProps) {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [model, setModel] = useState<SystemModelGraphDto | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<SystemFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [hiddenTypes, setHiddenTypes] = useState<Set<NodeType>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<GraphValidationResult | null>(null);
  const [loading, setLoading] = useState(true);

  const applyGraph = useCallback(
    (graph: SystemModelGraphDto) => {
      setModel(graph);
      setNodes(
        graph.nodes.map((node) => ({
          id: node.id,
          type: "system",
          position: { x: node.positionX, y: node.positionY },
          data: {
            name: node.name,
            nodeType: node.type,
            config: node.config,
          },
        })),
      );
      setEdges(
        graph.dependencies.map((dependency) => ({
          id: dependency.id,
          source: dependency.sourceNodeId,
          target: dependency.targetNodeId,
          data: {
            type: dependency.type,
            quantity: dependency.quantity,
            unit: dependency.unit,
            leadTimeDays: dependency.leadTimeDays,
          },
        })),
      );
      setDirty(false);
      setValidation(null);
    },
    [setEdges, setNodes],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const graph = await api<SystemModelGraphDto>(`/models/${modelId}`);
      applyGraph(graph);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to load model");
    } finally {
      setLoading(false);
    }
  }, [applyGraph, modelId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId) ?? null;

  const visibleNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        hidden: hiddenTypes.has(node.data.nodeType),
      })),
    [hiddenTypes, nodes],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        return;
      }
      const source = nodes.find((node) => node.id === connection.source);
      const target = nodes.find((node) => node.id === connection.target);
      if (!source || !target) {
        return;
      }
      const id = crypto.randomUUID();
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            id,
            data: {
              type: inferDependencyType(source.data.nodeType, target.data.nodeType),
              quantity: null,
              unit: null,
              leadTimeDays: null,
            },
          },
          current,
        ),
      );
      setSelectedEdgeId(id);
      setSelectedNodeId(null);
      setDirty(true);
    },
    [nodes, setEdges],
  );

  function addNode(type: NodeType) {
    const position = screenToFlowPosition({
      x: window.innerWidth / 2 - 80,
      y: window.innerHeight / 2,
    });
    const id = crypto.randomUUID();
    const name = NODE_TYPE_LABELS[type];
    setNodes((current) => [
      ...current,
      {
        id,
        type: "system",
        position,
        data: {
          name,
          nodeType: type,
          config: defaultNodeConfig(type),
        },
      },
    ]);
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const saved = await api<SystemModelGraphDto>(`/models/${modelId}/graph`, {
        method: "PUT",
        body: JSON.stringify({
          nodes: nodes.map((node) => ({
            id: node.id,
            type: node.data.nodeType,
            name: node.data.name,
            positionX: node.position.x,
            positionY: node.position.y,
            config: node.data.config,
          })),
          dependencies: edges.map((edge) => ({
            id: edge.id,
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
            type: edge.data?.type ?? "production_input",
            quantity: edge.data?.quantity ?? null,
            unit: edge.data?.unit ?? null,
            leadTimeDays: edge.data?.leadTimeDays ?? null,
          })),
        }),
      });
      applyGraph(saved);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to save model");
    } finally {
      setSaving(false);
    }
  }

  async function validate() {
    if (dirty) {
      await save();
    }
    setValidating(true);
    setError(null);
    try {
      setValidation(await api<GraphValidationResult>(`/models/${modelId}/validate`, { method: "POST" }));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to validate model");
    } finally {
      setValidating(false);
    }
  }

  if (loading) {
    return <p className="px-6 py-10 text-sm text-ink-muted">Loading model…</p>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <Link href={model ? `/workspaces/${model.workspaceId}` : "/workspaces"} className="text-xs text-accent hover:underline">
            Back to models
          </Link>
          <h1 className="font-serif text-2xl">{model?.name ?? "Model"}</h1>
          <p className="text-xs text-ink-muted">
            Time unit: days from model origin. {dirty ? "Unsaved changes" : "Saved"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void reload()}>
            Reload
          </Button>
          <Button variant="secondary" onClick={() => void validate()} disabled={validating}>
            {validating ? "Validating" : "Validate"}
          </Button>
          <Button onClick={() => void save()} disabled={saving || !dirty}>
            {saving ? "Saving" : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-line px-4 py-2">
        {NODE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => addNode(type)}
            className="border border-line bg-paper-raised px-2 py-1 text-xs hover:border-ink"
          >
            Add {NODE_TYPE_LABELS[type]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void fitView({ padding: 0.2 })}
          className="border border-line bg-paper-raised px-2 py-1 text-xs hover:border-ink"
        >
          Fit graph
        </button>
      </div>

      <div className="flex flex-wrap gap-3 border-b border-line px-4 py-2 text-xs">
        <span className="text-ink-muted">Show</span>
        {NODE_TYPES.map((type) => (
          <label key={type} className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={!hiddenTypes.has(type)}
              onChange={(event) => {
                setHiddenTypes((current) => {
                  const next = new Set(current);
                  if (event.target.checked) {
                    next.delete(type);
                  } else {
                    next.add(type);
                  }
                  return next;
                });
              }}
            />
            {NODE_TYPE_LABELS[type]}
          </label>
        ))}
      </div>

      {error ? <p className="border-b border-line px-4 py-2 text-sm text-danger">{error}</p> : null}
      {validation ? (
        <div className="border-b border-line px-4 py-2 text-sm">
          {validation.valid ? (
            <p className="text-ok">Graph is valid for simulation.</p>
          ) : (
            <ul className="space-y-1 text-danger">
              {validation.errors.map((issue, index) => (
                <li key={`${issue.code}-${index}`}>{issue.message}</li>
              ))}
            </ul>
          )}
          {validation.warnings.length > 0 ? (
            <ul className="mt-2 space-y-1 text-warn">
              {validation.warnings.map((issue, index) => (
                <li key={`${issue.code}-${index}`}>{issue.message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-h-[480px]">
          <ReactFlow
            nodes={visibleNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={(changes) => {
              onNodesChange(changes);
              if (changes.some((change) => change.type !== "select")) {
                setDirty(true);
              }
            }}
            onEdgesChange={(changes) => {
              onEdgesChange(changes);
              if (changes.some((change) => change.type !== "select")) {
                setDirty(true);
              }
            }}
            onConnect={onConnect}
            onNodeClick={(_event, node) => {
              setSelectedNodeId(node.id);
              setSelectedEdgeId(null);
            }}
            onEdgeClick={(_event, edge) => {
              setSelectedEdgeId(edge.id);
              setSelectedNodeId(null);
            }}
            onPaneClick={() => {
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
            }}
            fitView
            deleteKeyCode={["Backspace", "Delete"]}
          >
            <Background gap={20} color="#d8d1c4" />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </div>
        <NodeDetailPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onChangeNode={(nodeId, patch) => {
            setNodes((current) =>
              current.map((node) =>
                node.id === nodeId
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        name: patch.name ?? node.data.name,
                        config: patch.config ?? node.data.config,
                      },
                    }
                  : node,
              ),
            );
            setDirty(true);
          }}
          onChangeEdge={(edgeId, patch) => {
            setEdges((current) =>
              current.map((edge) =>
                edge.id === edgeId
                  ? {
                      ...edge,
                      data: {
                        ...edge.data,
                        ...patch,
                      },
                    }
                  : edge,
              ),
            );
            setDirty(true);
          }}
          onDeleteNode={(nodeId) => {
            setNodes((current) => current.filter((node) => node.id !== nodeId));
            setEdges((current) => current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
            setSelectedNodeId(null);
            setDirty(true);
          }}
          onDeleteEdge={(edgeId) => {
            setEdges((current) => current.filter((edge) => edge.id !== edgeId));
            setSelectedEdgeId(null);
            setDirty(true);
          }}
        />
      </div>
    </div>
  );
}
