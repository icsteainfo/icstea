"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { TaskTemplateSubtask } from "@/lib/templates/types";

export function TemplateSubtaskRow({
  subtask,
  onDelete,
  onSaved,
}: {
  subtask: TaskTemplateSubtask;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: subtask.id });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(subtask.title);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/template-subtasks/${subtask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      setEditing(false);
      onSaved();
    } catch {
      toast.error("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 rounded-lg border bg-background p-2.5"
      >
        <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          保存
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setTitle(subtask.title);
            setEditing(false);
          }}
        >
          キャンセル
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border bg-background p-2.5"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="並び替え"
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <p className="flex-1 text-sm">{subtask.title}</p>
      <Button type="button" variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
        <PencilIcon className="size-4" />
      </Button>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger
          render={
            <Button type="button" variant="ghost" size="icon-sm">
              <Trash2Icon className="size-4" />
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>サブタスクを削除しますか？</DialogTitle>
            <DialogDescription>この操作は取り消せません。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteOpen(false);
                onDelete();
              }}
            >
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
