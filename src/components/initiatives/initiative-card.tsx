"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  INITIATIVE_PRIORITY_CLASSNAME,
  INITIATIVE_PRIORITY_LABELS,
  INITIATIVE_PRIORITY_ORDER,
} from "./initiative-priority-badge";
import { InitiativeInlineField } from "./initiative-inline-field";
import { InitiativeMemoEditor } from "./initiative-memo-editor";
import { InitiativeTodoList } from "./initiative-todo-list";
import { InitiativeForm } from "./initiative-form";
import type { InitiativeWithTasks } from "@/lib/initiatives/types";
import type { InitiativePriority } from "@/types/database.types";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export function InitiativeCard({
  initiative,
  onRemoved,
  onPriorityChange,
}: {
  initiative: InitiativeWithTasks;
  onRemoved: (id: string) => void;
  onPriorityChange: (id: string, priority: InitiativePriority) => void;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);

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
    <div className="shadow-dreamy-sm relative isolate flex flex-col gap-1 rounded-2xl border-2 border-border bg-card p-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-semibold break-words text-foreground">
          {initiative.title}
        </p>
        <Select
          items={INITIATIVE_PRIORITY_LABELS}
          value={initiative.priority}
          onValueChange={(v: string | null) =>
            v && onPriorityChange(initiative.id, v as InitiativePriority)
          }
        >
          <SelectTrigger
            size="sm"
            className={cn(
              "h-6 shrink-0 gap-1 px-2 text-[11px] font-medium whitespace-nowrap",
              INITIATIVE_PRIORITY_CLASSNAME[initiative.priority],
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INITIATIVE_PRIORITY_ORDER.map((p) => (
              <SelectItem key={p} value={p}>
                {INITIATIVE_PRIORITY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px]">
        {initiative.due_date ? (
          <Badge variant="outline" className="h-5 px-1.5 text-[11px]">
            期限: {formatDate(initiative.due_date)}
          </Badge>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <button type="button" onClick={() => setEditOpen(true)} className="hover:text-foreground hover:underline">
            編集
          </button>
          <button
            type="button"
            onClick={handleToggleArchive}
            disabled={archiving}
            className="hover:text-foreground hover:underline disabled:opacity-50"
          >
            {initiative.archived ? "アーカイブ解除" : "アーカイブ"}
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="text-destructive hover:underline"
          >
            削除
          </button>
        </div>
      </div>

      <InitiativeInlineField
        label="次にやること"
        initiativeId={initiative.id}
        field="next_action"
        initialValue={initiative.next_action ?? ""}
        placeholder=""
        emptyText="（未設定）"
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
