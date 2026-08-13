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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SubtaskRow } from "./subtask-row";
import { SubtaskForm } from "./subtask-form";
import { ProgressEditor } from "./progress-editor";
import { computeProgress } from "@/lib/subtasks/progress";
import type { SubtaskWithRelations } from "@/lib/subtasks/types";
import type { Staff } from "@/lib/tasks/types";
import type { TaskStatus } from "@/types/database.types";

export function SubtaskList({
  taskId,
  taskStatus,
  initialSubtasks,
  progressOverride,
  staff,
}: {
  taskId: string;
  taskStatus: TaskStatus;
  initialSubtasks: SubtaskWithRelations[];
  progressOverride: number | null;
  staff: Staff[];
}) {
  const router = useRouter();
  const [subtasks, setSubtasks] = useState(initialSubtasks);
  const [confirmParentComplete, setConfirmParentComplete] = useState(false);

  // router.refresh()でサーバーから新しいinitialSubtasksが渡されたら、ローカル状態を追従させる
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

  const progress = computeProgress(progressOverride, subtasks);

  async function handleToggle(subtaskId: string, completed: boolean) {
    const previous = subtasks;
    const next = subtasks.map((s) =>
      s.id === subtaskId
        ? {
            ...s,
            status: completed ? ("completed" as const) : ("open" as const),
          }
        : s,
    );
    setSubtasks(next);

    try {
      const res = await fetch(`/api/subtasks/${subtaskId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error();

      if (
        completed &&
        taskStatus === "open" &&
        next.length > 0 &&
        next.every((s) => s.status === "completed")
      ) {
        setConfirmParentComplete(true);
      }
      router.refresh();
    } catch {
      setSubtasks(previous);
      toast.error("更新に失敗しました");
    }
  }

  async function handleDelete(subtaskId: string) {
    try {
      const res = await fetch(`/api/subtasks/${subtaskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("サブタスクを削除しました");
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
      const res = await fetch(`/api/tasks/${taskId}/subtasks/reorder`, {
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

  async function handleCompleteParent() {
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
      if (!res.ok) throw new Error();
      toast.success("大項目を完了にしました");
      router.refresh();
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setConfirmParentComplete(false);
    }
  }

  return (
    <div className="space-y-3">
      <ProgressEditor taskId={taskId} progress={progress} />

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
                <SubtaskRow
                  key={subtask.id}
                  subtask={subtask}
                  staff={staff}
                  onToggle={(completed) => handleToggle(subtask.id, completed)}
                  onDelete={() => handleDelete(subtask.id)}
                  onSaved={() => router.refresh()}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <SubtaskForm taskId={taskId} staff={staff} onCreated={() => router.refresh()} />

      <Dialog open={confirmParentComplete} onOpenChange={setConfirmParentComplete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>すべてのサブタスクが完了しました</DialogTitle>
            <DialogDescription>大項目も完了にしますか？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmParentComplete(false)}>
              いいえ
            </Button>
            <Button onClick={handleCompleteParent}>完了にする</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
