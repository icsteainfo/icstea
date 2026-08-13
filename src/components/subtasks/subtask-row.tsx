"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SubtaskWithRelations } from "@/lib/subtasks/types";
import type { Staff } from "@/lib/tasks/types";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export function SubtaskRow({
  subtask,
  staff,
  onToggle,
  onDelete,
  onSaved,
}: {
  subtask: SubtaskWithRelations;
  staff: Staff[];
  onToggle: (completed: boolean) => void;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: subtask.id });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(subtask.title);
  const [dueDate, setDueDate] = useState(subtask.due_date ?? "");
  const [assigneeType, setAssigneeType] = useState<"owner" | "staff">(
    subtask.assignee_type,
  );
  const [assigneeStaffId, setAssigneeStaffId] = useState(
    subtask.assignee_staff_id ?? "",
  );
  const [deleteOpen, setDeleteOpen] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isCompleted = subtask.status === "completed";

  async function handleSave() {
    if (assigneeType === "staff" && !assigneeStaffId) {
      toast.error("担当スタッフを選択してください");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/subtasks/${subtask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          due_date: dueDate || null,
          assignee_type: assigneeType,
          assignee_staff_id: assigneeType === "staff" ? assigneeStaffId : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "保存に失敗しました");
      }
      setEditing(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="space-y-2 rounded-lg border bg-background p-3"
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="サブタスク名"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Select
            items={{ owner: "自分", staff: "スタッフ" }}
            value={assigneeType}
            onValueChange={(v) => setAssigneeType(v as "owner" | "staff")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">自分</SelectItem>
              <SelectItem value="staff">スタッフ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {assigneeType === "staff" && (
          <Select
            items={Object.fromEntries(staff.map((s) => [s.id, s.name]))}
            value={assigneeStaffId}
            onValueChange={(v: string | null) => setAssigneeStaffId(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="スタッフを選択" />
            </SelectTrigger>
            <SelectContent>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditing(false)}
          >
            キャンセル
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
            保存
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 rounded-lg border bg-background p-2.5"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="並び替え"
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <div className="pt-0.5">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={(v) => onToggle(v === true)}
          aria-label={isCompleted ? "未完了に戻す" : "完了にする"}
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p
          className={
            isCompleted
              ? "text-sm text-muted-foreground line-through"
              : "text-sm font-medium"
          }
        >
          {subtask.title}
        </p>
        <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
          {subtask.due_date && (
            <Badge variant="outline">期限: {formatDate(subtask.due_date)}</Badge>
          )}
          <Badge variant="outline">担当: {subtask.assignee_name}</Badge>
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setEditing(true)}
        >
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
    </div>
  );
}
