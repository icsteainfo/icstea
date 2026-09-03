"use client";

import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useAutosaveField } from "./use-autosave-field";

// カード上の「メモ」。空欄の時は見出しだけの1行、入力済みの時は見出し+本文を表示する。
// クリックするとtextareaに切り替わり、フォーカスが外れると自動保存して表示に戻る。
export function InitiativeMemoEditor({
  initiativeId,
  initialMemo,
}: {
  initiativeId: string;
  initialMemo: string;
}) {
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { value, status, handleChange, handleBlur } = useAutosaveField(
    initialMemo,
    async (memo) => {
      const res = await fetch(`/api/initiatives/${initiativeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memo }),
      });
      if (!res.ok) throw new Error();
    },
  );

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const statusLabel =
    status === "saving"
      ? "保存中…"
      : status === "saved"
        ? "保存済み"
        : status === "error"
          ? "保存に失敗しました"
          : "";

  if (editing) {
    return (
      <div className="space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-muted-foreground">💭 メモ</p>
          {statusLabel && <span className="text-[11px] text-muted-foreground">{statusLabel}</span>}
        </div>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => {
            handleBlur();
            setEditing(false);
          }}
          rows={2}
          maxLength={4000}
          className="resize-none border-none bg-white/60 text-sm focus-visible:ring-1 dark:bg-black/20"
        />
      </div>
    );
  }

  if (!value) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="block w-full rounded-md px-1 py-0.5 text-left text-xs font-semibold text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
      >
        💭 メモ
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="block w-full rounded-md px-1 py-0.5 text-left hover:bg-black/5 dark:hover:bg-white/10"
    >
      <span className="block text-xs font-semibold text-muted-foreground">💭 メモ</span>
      <span className="block text-sm whitespace-pre-wrap">{value}</span>
    </button>
  );
}
