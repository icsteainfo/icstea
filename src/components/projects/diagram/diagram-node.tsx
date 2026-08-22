"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

export type DiagramNodeData = {
  text: string;
  readOnly?: boolean;
  onChangeText?: (text: string) => void;
  onDelete?: () => void;
};

export function DiagramNode({ data, selected }: NodeProps) {
  const { text, readOnly, onChangeText, onDelete } = data as DiagramNodeData;

  return (
    <div
      className={cn(
        "group relative min-w-36 max-w-56 rounded-lg border-2 bg-background px-3 py-2 text-sm shadow-sm",
        selected ? "border-primary" : "border-primary/30",
      )}
    >
      <Handle type="target" position={Position.Left} className="!size-2.5 !bg-primary" />

      {readOnly ? (
        <p className="whitespace-pre-wrap break-words">{text || "(未入力)"}</p>
      ) : (
        <textarea
          className="nodrag nowheel w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          value={text}
          onChange={(e) => onChangeText?.(e.target.value)}
          rows={2}
          placeholder="要因・思考を入力"
        />
      )}

      {!readOnly && (
        <button
          type="button"
          onClick={onDelete}
          className="nodrag absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground opacity-70 hover:opacity-100"
          aria-label="ノードを削除"
        >
          ×
        </button>
      )}

      <Handle type="source" position={Position.Right} className="!size-2.5 !bg-primary" />
    </div>
  );
}
