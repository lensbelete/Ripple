"use client";

import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { EngineSimulationResult, NodeConfig, SimulationRunDetailDto } from "@ripple/shared-types";
import { SystemNode, type SystemFlowNode } from "@/components/graphs/system-node";

const nodeTypes = { system: SystemNode };

export function ImpactGraph({ run }: { run: SimulationRunDetailDto }) {
  const result: EngineSimulationResult = run.result;
  const affected = new Map(result.affectedNodes.map((item) => [item.nodeId, item]));
  const origins = new Set(run.modifications.map((item) => item.nodeId));

  const nodes: Node[] = run.modelSnapshot.nodes.map((node) => {
    const impact = affected.get(node.id);
    const origin = origins.has(node.id);
    return {
      id: node.id,
      type: "system",
      position: { x: node.positionX, y: node.positionY },
      data: {
        name: node.name,
        nodeType: node.type,
        config: node.config as NodeConfig,
      },
      style: origin
        ? { outline: "2px solid #1f4d4a", outlineOffset: "3px" }
        : impact
          ? { outline: "2px solid #8a5a18", outlineOffset: "3px" }
          : { opacity: 0.45 },
    } as SystemFlowNode;
  });

  const edges: Edge[] = run.modelSnapshot.dependencies.map((dependency) => ({
    id: dependency.id,
    source: dependency.sourceNodeId,
    target: dependency.targetNodeId,
    style: {
      stroke: affected.has(dependency.targetNodeId) || affected.has(dependency.sourceNodeId) ? "#8a5a18" : "#d8d1c4",
    },
  }));

  return (
    <div className="h-[420px] border border-line bg-paper">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}>
        <Background gap={20} color="#d8d1c4" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
