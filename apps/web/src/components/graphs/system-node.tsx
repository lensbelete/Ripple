import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { NODE_TYPE_LABELS, type NodeConfig, type NodeType } from "@ripple/shared-types";

export type SystemNodeData = {
  name: string;
  nodeType: NodeType;
  config: NodeConfig;
};

export type SystemFlowNode = Node<SystemNodeData, "system">;

export function SystemNode({ data, selected }: NodeProps<SystemFlowNode>) {
  return (
    <div
      className={`min-w-[160px] border bg-paper-raised px-3 py-2 shadow-sm ${
        selected ? "border-accent" : "border-ink"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !bg-accent" />
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
        {NODE_TYPE_LABELS[data.nodeType]}
      </p>
      <p className="mt-1 text-sm font-medium">{data.name}</p>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !bg-accent" />
    </div>
  );
}
