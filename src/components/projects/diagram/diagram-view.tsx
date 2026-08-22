"use client";

import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import { ReactFlow, Background, MarkerType, type Node, type Edge } from "@xyflow/react";
import { DiagramNode, type DiagramNodeData } from "./diagram-node";
import { DiagramEdge, type DiagramEdgeData } from "./diagram-edge";
import type { ProjectDiagram } from "@/lib/projects/types";

const nodeTypes = { diagram: DiagramNode };
const edgeTypes = { diagram: DiagramEdge };

export function DiagramView({ diagram }: { diagram: ProjectDiagram }) {
  const nodes = useMemo<Node[]>(
    () =>
      diagram.nodes.map((n) => ({
        id: n.id,
        type: "diagram",
        position: { x: n.x, y: n.y },
        data: { text: n.text, readOnly: true } satisfies DiagramNodeData,
        draggable: false,
      })),
    [diagram.nodes],
  );

  const edges = useMemo<Edge[]>(
    () =>
      diagram.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "diagram",
        markerEnd: { type: MarkerType.ArrowClosed },
        data: { label: e.label ?? "", readOnly: true } satisfies DiagramEdgeData,
      })),
    [diagram.edges],
  );

  return (
    <div className="h-64 w-full overflow-hidden rounded-lg border bg-muted/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        fitView
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
