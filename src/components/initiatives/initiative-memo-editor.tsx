"use client";

import { Textarea } from "@/components/ui/textarea";
import { useAutosaveField } from "./use-autosave-field";

export function InitiativeMemoEditor({
  initiativeId,
  initialMemo,
}: {
  initiativeId: string;
  initialMemo: string;
}) {
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

  const statusLabel =
    status === "saving"
      ? "保存中…"
      : status === "saved"
        ? "保存済み"
        : status === "error"
          ? "保存に失敗しました"
          : "";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">💭 メモ</p>
        <span className="text-[11px] text-muted-foreground">{statusLabel}</span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="思いつき・確認事項・忘れたくないことなど"
        rows={3}
        maxLength={4000}
        className="resize-none border-none bg-white/60 text-sm focus-visible:ring-1 dark:bg-black/20"
      />
    </div>
  );
}
