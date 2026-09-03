"use client";

import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { SparkleMotif } from "./motifs";

const SAVE_DELAY_MS = 800;

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function QuickMemoSection({ initialContent }: { initialContent: string }) {
  const [value, setValue] = useState(initialContent);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedValueRef = useRef(initialContent);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function save(content: string) {
    if (content === savedValueRef.current) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/quick-memo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error();
      savedValueRef.current = content;
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  function scheduleSave(content: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void save(content), SAVE_DELAY_MS);
  }

  function handleChange(next: string) {
    setValue(next);
    scheduleSave(next);
  }

  function handleBlur() {
    if (timerRef.current) clearTimeout(timerRef.current);
    void save(value);
  }

  const statusLabel =
    status === "saving"
      ? "保存中…"
      : status === "saved"
        ? "保存済み"
        : status === "error"
          ? "保存に失敗しました"
          : "";

  return (
    <div className="shadow-dreamy relative isolate rounded-3xl border-2 border-tint-yellow-line bg-tint-yellow p-3">
      <SparkleMotif className="pop-motif pop-twinkle top-3 right-4 size-5 text-[#F0B429] opacity-80" />
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">📝 メモ</h2>
        <span className="text-xs text-muted-foreground">{statusLabel}</span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="思いついたことをすぐメモ…"
        rows={2}
        maxLength={4000}
        className="resize-none border-none bg-white/60 focus-visible:ring-1"
      />
    </div>
  );
}
