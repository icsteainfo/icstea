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
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TemplateSubtaskRow } from "./template-subtask-row";
import { TemplateSubtaskForm } from "./template-subtask-form";
import type { TaskTemplateSubtask } from "@/lib/templates/types";

export function TemplateSubtaskList({
  templateId,
  initialSubtasks,
}: {
  templateId: string;
  initialSubtasks: TaskTemplateSubtask[];
}) {
  const router = useRouter();
  const [subtasks, setSubtasks] = useState(initialSubtasks);

  const [prevInitialSubtasks, setPrevInitialSubtasks] = useState(initialSubtasks);
  if (initialSubtasks !== prevInitialSubtasks) {
    setPrevInitialSubtasks(initialSubtasks);
    setSubtasks(initialSubtasks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/template-subtasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("削除しました");
      router.refresh();
    } catch {
      toast.error("削除に失敗しました");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = subtasks.findIndex((s) => s.id === active.id);
    const newIndex = subtasks.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previous = subtasks;
    const reordered = arrayMove(subtasks, oldIndex, newIndex);
    setSubtasks(reordered);

    try {
      const res = await fetch(`/api/templates/${templateId}/subtasks/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((s) => s.id) }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setSubtasks(previous);
      toast.error("並び替えに失敗しました");
    }
  }

  return (
    <div className="space-y-3">
      {subtasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">サブタスクはまだありません</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={subtasks.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <TemplateSubtaskRow
                  key={subtask.id}
                  subtask={subtask}
                  onDelete={() => handleDelete(subtask.id)}
                  onSaved={() => router.refresh()}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <TemplateSubtaskForm templateId={templateId} onCreated={() => router.refresh()} />
    </div>
  );
}
