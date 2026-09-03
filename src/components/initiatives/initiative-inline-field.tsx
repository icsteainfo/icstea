"use client";

import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutosaveField } from "./use-autosave-field";

// カード上の「現在」「次にやること」用の、クリックでその場編集できるフィールド。
// 通常はテキスト表示、クリックまたは「編集」でtextareaに切り替わり、
// フォーカスが外れると自動保存して表示に戻る。
export function InitiativeInlineField({
  label,
  initiativeId,
  field,
  initialValue,
  placeholder,
  emptyText,
}: {
  label: string;
  initiativeId: string;
  field: "current_state" | "next_action";
  initialValue: string;
  placeholder: string;
  emptyText: string;
}) {
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { value, status, handleChange, handleBlur } = useAutosaveField(
    initialValue,
    async (next) => {
      const res = await fetch(`/api/initiatives/${initiativeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      });
      if (!res.ok) throw new Error();
    },
  );

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const statusLabel =
    status === "saving" ? "保存中…" : status === "saved" ? "保存済み" : status === "error" ? "保存に失敗しました" : "";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
          {editing && statusLabel && (
            <span className="text-[11px] text-muted-foreground">{statusLabel}</span>
          )}
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
            >
              編集
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => {
            handleBlur();
            setEditing(false);
          }}
          placeholder={placeholder}
          rows={2}
          maxLength={2000}
          className="resize-none text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={cn(
            "block w-full rounded-md px-1 py-0.5 text-left text-sm whitespace-pre-wrap hover:bg-black/5 dark:hover:bg-white/10",
            !value && "text-muted-foreground italic",
          )}
        >
          {value || emptyText}
        </button>
      )}
    </div>
  );
}
