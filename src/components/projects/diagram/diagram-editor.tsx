"use client";

import "@xyflow/react/dist/style.css";
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { DiagramNode, type DiagramNodeData } from "./diagram-node";
import { DiagramEdge, type DiagramEdgeData } from "./diagram-edge";
import type { ProjectDiagram } from "@/lib/projects/types";

const nodeTypes = { diagram: DiagramNode };
const edgeTypes = { diagram: DiagramEdge };

export type DiagramEditorHandle = {
  getDiagram: () => ProjectDiagram;
};

export const DiagramEditor = forwardRef<DiagramEditorHandle>(function DiagramEditor(_props, ref) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const idCounter = useRef(0);
  const [hint, setHint] = useState(true);

  const nextId = useCallback((prefix: string) => {
    idCounter.current += 1;
    return `${prefix}_${Date.now()}_${idCounter.current}`;
  }, []);

  const updateNodeText = useCallback(
    (id: string, text: string) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, text } } : n)),
      );
    },
    [setNodes],
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    },
    [setNodes, setEdges],
  );

  const updateEdgeLabel = useCallback(
    (id: string, label: string) => {
      setEdges((eds) =>
        eds.map((e) => (e.id === id ? { ...e, data: { ...e.data, label } } : e)),
      );
    },
    [setEdges],
  );

  const deleteEdge = useCallback(
    (id: string) => {
      setEdges((eds) => eds.filter((e) => e.id !== id));
    },
    [setEdges],
  );

  const addNode = useCallback(() => {
    setHint(false);
    const id = nextId("n");
    const index = idCounter.current;
    const position = {
      x: 40 + (index % 4) * 220,
      y: 40 + Math.floor(index / 4) * 120,
    };
    const data: DiagramNodeData = {
      text: "",
      onChangeText: (text) => updateNodeText(id, text),
      onDelete: () => deleteNode(id),
    };
    setNodes((nds) => [...nds, { id, type: "diagram", position, data }]);
  }, [nextId, setNodes, updateNodeText, deleteNode]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const id = nextId("e");
      const data: DiagramEdgeData = {
        label: "",
        onChangeLabel: (label) => updateEdgeLabel(id, label),
        onDelete: () => deleteEdge(id),
      };
      setEdges((eds) =>
        addEdge(
          { ...connection, id, type: "diagram", markerEnd: { type: MarkerType.ArrowClosed }, data },
          eds,
        ),
      );
    },
    [nextId, setEdges, updateEdgeLabel, deleteEdge],
  );

  useImperativeHandle(ref, () => ({
    getDiagram: () => ({
      nodes: nodes.map((n) => ({
        id: n.id,
        text: (n.data as DiagramNodeData).text,
        x: n.position.x,
        y: n.position.y,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: (e.data as DiagramEdgeData).label || null,
      })),
    }),
  }));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {hint
            ? "「＋ノード追加」で要因を追加し、右の丸(ハンドル)をドラッグして矢印でつなげます"
            : `ノード${nodes.length}件 / 矢印${edges.length}件`}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={addNode}>
          ＋ノード追加
        </Button>
      </div>
      <div className="h-96 w-full overflow-hidden rounded-lg border bg-muted/20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          deleteKeyCode={["Backspace", "Delete"]}
          fitView
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
});
