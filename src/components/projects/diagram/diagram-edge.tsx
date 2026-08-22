"use client";

import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";

export type DiagramEdgeData = {
  label: string;
  readOnly?: boolean;
  onChangeLabel?: (label: string) => void;
  onDelete?: () => void;
};

export function DiagramEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const { label, readOnly, onChangeLabel, onDelete } = (data ?? {}) as DiagramEdgeData;

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ strokeWidth: selected ? 2.5 : 1.5 }} />
      <EdgeLabelRenderer>
        <div
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
          className="nodrag nopan pointer-events-auto absolute"
        >
          {readOnly ? (
            label && (
              <span className="rounded bg-background px-1.5 py-0.5 text-xs text-muted-foreground shadow">
                {label}
              </span>
            )
          ) : (
            <div className="flex items-center gap-1 rounded bg-background px-1 py-0.5 shadow">
              <input
                className="w-20 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                value={label}
                placeholder="関係"
                onChange={(e) => onChangeLabel?.(e.target.value)}
              />
              <button
                type="button"
                onClick={onDelete}
                className="text-xs text-destructive"
                aria-label="矢印を削除"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
