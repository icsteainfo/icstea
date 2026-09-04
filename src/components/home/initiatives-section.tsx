"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StarMotif } from "./motifs";
import { IdolEmptyState } from "@/components/idol/idol-image";
import { InitiativeCard } from "@/components/initiatives/initiative-card";
import { AddInitiativeButton } from "@/components/initiatives/add-initiative-button";
import { INITIATIVE_PRIORITY_ORDER } from "@/components/initiatives/initiative-priority-badge";
import type { Initiative, InitiativeWithTasks } from "@/lib/initiatives/types";
import type { InitiativePriority } from "@/types/database.types";

// 基本順序: A(重要かつ緊急) → B → C → D。
// 同じ優先度内では期限が近いものを優先し(期限なしは最後)、それ以外は登録順で安定させる。
function sortInitiatives(initiatives: InitiativeWithTasks[]): InitiativeWithTasks[] {
  return [...initiatives].sort((a, b) => {
    const priorityDiff =
      INITIATIVE_PRIORITY_ORDER.indexOf(a.priority) - INITIATIVE_PRIORITY_ORDER.indexOf(b.priority);
    if (priorityDiff !== 0) return priorityDiff;

    if (a.due_date !== b.due_date) {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date < b.due_date ? -1 : 1;
    }

    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.created_at < b.created_at ? -1 : 1;
  });
}

export function InitiativesSection({
  initialInitiatives,
  initialArchived,
}: {
  initialInitiatives: InitiativeWithTasks[];
  initialArchived: InitiativeWithTasks[];
}) {
  const router = useRouter();
  const [initiatives, setInitiatives] = useState(initialInitiatives);
  const [showArchived, setShowArchived] = useState(false);

  // router.refresh()でサーバーから新しいinitialInitiativesが渡されたら、ローカル状態を追従させる
  const [prevInitial, setPrevInitial] = useState(initialInitiatives);
  if (initialInitiatives !== prevInitial) {
    setPrevInitial(initialInitiatives);
    setInitiatives(initialInitiatives);
  }

  function handleCreated(created: Initiative) {
    setInitiatives((prev) => [...prev, { ...created, tasks: [] }]);
    router.refresh();
  }

  function handleRemoved(id: string) {
    setInitiatives((prev) => prev.filter((i) => i.id !== id));
  }

  async function handlePriorityChange(id: string, priority: InitiativePriority) {
    const previous = initiatives;
    setInitiatives((prev) => prev.map((i) => (i.id === id ? { ...i, priority } : i)));
    try {
      const res = await fetch(`/api/initiatives/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setInitiatives(previous);
      toast.error("更新に失敗しました");
    }
  }

  const displayed = showArchived ? initialArchived : sortInitiatives(initiatives);

  return (
    <div className="shadow-dreamy relative isolate rounded-3xl border-2 border-tint-pink-line bg-tint-pink p-3">
      <StarMotif className="pop-motif pop-twinkle top-3 right-4 size-5 text-[#FF8FBC] opacity-80" />
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">
          📌 今取り組んでいること
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {displayed.length}件
          </span>
        </h2>
        <div className="flex items-center gap-3">
          {(initialArchived.length > 0 || showArchived) && (
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              {showArchived ? "一覧に戻る" : "アーカイブを見る"}
            </button>
          )}
          <AddInitiativeButton onCreated={handleCreated} />
        </div>
      </div>

      {displayed.length === 0 ? (
        showArchived ? (
          <p className="rounded-2xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
            アーカイブされた取り組みはありません
          </p>
        ) : (
          <IdolEmptyState message="今取り組んでいることはまだありません" caption="いったん落ち着いてます" />
        )
      ) : (
        // CSS Gridは行ごとに高さが揃ってしまい、片方の列に丈の長いカードがあると
        // もう片方の列の次のカードの上に不要な空白ができるため、
        // 列ごとに上から隙間なく詰まるmasonryレイアウト(CSS columns)にしている。
        <div className="columns-1 gap-1.5 sm:columns-2">
          {displayed.map((initiative) => (
            <div key={initiative.id} className="mb-1 break-inside-avoid">
              <InitiativeCard
                initiative={initiative}
                onRemoved={handleRemoved}
                onPriorityChange={handlePriorityChange}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
