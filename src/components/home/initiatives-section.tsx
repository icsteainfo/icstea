"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { StarMotif } from "./motifs";
import { InitiativeCard } from "@/components/initiatives/initiative-card";
import { AddInitiativeButton } from "@/components/initiatives/add-initiative-button";
import type { Initiative, InitiativeWithTasks } from "@/lib/initiatives/types";

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = initiatives.findIndex((i) => i.id === active.id);
    const newIndex = initiatives.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previous = initiatives;
    const reordered = arrayMove(initiatives, oldIndex, newIndex);
    setInitiatives(reordered);

    try {
      const res = await fetch("/api/initiatives/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((i) => i.id) }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setInitiatives(previous);
      toast.error("並び替えに失敗しました");
    }
  }

  function handleCreated(created: Initiative) {
    setInitiatives((prev) => [...prev, { ...created, tasks: [] }]);
    router.refresh();
  }

  function handleRemoved(id: string) {
    setInitiatives((prev) => prev.filter((i) => i.id !== id));
  }

  const displayed = showArchived ? initialArchived : initiatives;

  return (
    <div className="shadow-dreamy relative isolate rounded-3xl border-2 border-tint-pink-line bg-tint-pink p-4">
      <StarMotif className="pop-motif pop-twinkle top-3 right-4 size-5 text-[#FF8FBC] opacity-80" />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
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
        <p className="rounded-2xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          {showArchived ? "アーカイブされた取り組みはありません" : "今取り組んでいることはまだありません"}
        </p>
      ) : showArchived ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {displayed.map((initiative) => (
            <InitiativeCard
              key={initiative.id}
              initiative={initiative}
              onRemoved={handleRemoved}
            />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={initiatives.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid gap-3 sm:grid-cols-2">
              {initiatives.map((initiative) => (
                <InitiativeCard
                  key={initiative.id}
                  initiative={initiative}
                  onRemoved={handleRemoved}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
