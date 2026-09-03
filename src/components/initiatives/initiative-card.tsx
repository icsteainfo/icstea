"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InitiativeStatusBadge } from "./initiative-status-badge";
import { InitiativeInlineField } from "./initiative-inline-field";
import { InitiativeMemoEditor } from "./initiative-memo-editor";
import { InitiativeTodoList } from "./initiative-todo-list";
import { InitiativeForm } from "./initiative-form";
import type { InitiativeWithTasks } from "@/lib/initiatives/types";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export function InitiativeCard({
  initiative,
  onRemoved,
}: {
  initiative: InitiativeWithTasks;
  onRemoved: (id: string) => void;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: initiative.id,
    disabled: initiative.archived,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  async function handleToggleArchive() {
    setArchiving(true);
    try {
      const res = await fetch(`/api/initiatives/${initiative.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !initiative.archived }),
      });
      if (!res.ok) throw new Error();
      toast.success(initiative.archived ? "アーカイブを解除しました" : "アーカイブしました");
      onRemoved(initiative.id);
      router.refresh();
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setArchiving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/initiatives/${initiative.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("取り組みを削除しました");
      setDeleteOpen(false);
      onRemoved(initiative.id);
      router.refresh();
    } catch {
      toast.error("削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="shadow-dreamy-sm relative isolate flex flex-col gap-3 rounded-[22px] border-2 border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-1.5">
          {!initiative.archived && (
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
              aria-label="並び替え"
            >
              <GripVerticalIcon className="size-4" />
            </button>
          )}
          <p className="min-w-0 font-semibold break-words text-foreground">{initiative.title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <InitiativeStatusBadge status={initiative.status} />
        </div>
      </div>

      {initiative.due_date && (
        <Badge variant="outline" className="w-fit">
          期限: {formatDate(initiative.due_date)}
        </Badge>
      )}

      <div className="flex items-center justify-end gap-2.5 text-xs">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="text-muted-foreground hover:text-foreground hover:underline"
        >
          編集
        </button>
        <button
          type="button"
          onClick={handleToggleArchive}
          disabled={archiving}
          className="text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50"
        >
          {initiative.archived ? "アーカイブを解除" : "アーカイブ"}
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="text-destructive hover:underline"
        >
          削除
        </button>
      </div>

      <InitiativeInlineField
        label="次にやること"
        initiativeId={initiative.id}
        field="next_action"
        initialValue={initiative.next_action ?? ""}
        placeholder="直近でやるアクション"
        emptyText="(未設定)"
      />

      <InitiativeMemoEditor initiativeId={initiative.id} initialMemo={initiative.memo ?? ""} />

      <InitiativeTodoList tasks={initiative.tasks} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>取り組みを編集</DialogTitle>
          </DialogHeader>
          <InitiativeForm
            mode="edit"
            initiative={initiative}
            onSaved={() => setEditOpen(false)}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>「{initiative.title}」を削除しますか？</DialogTitle>
            <DialogDescription>
              この操作は取り消せません。紐づいているTodoは削除されず、取り組み未所属になります。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
