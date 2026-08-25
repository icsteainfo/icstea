"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskForm } from "./task-form";
import { SaveAsTemplateButton } from "./save-as-template-button";
import { MakeRecurringButton } from "./make-recurring-button";
import { ConvertToProjectButton } from "./convert-to-project-button";
import type { Category, Staff, TaskWithRelations } from "@/lib/tasks/types";
import type { Project } from "@/lib/projects/types";

type FormLists = { categories: Category[]; staff: Staff[]; projects: Project[] };

// ホーム画面のTodoカードから、ページ遷移せずに編集・複製・削除を行うための操作群。
// 編集フォームで使うカテゴリー・スタッフ・プロジェクトの一覧は、初回操作時に一度だけ取得する。
// タイトル部分のクリックと「編集」ボタンで同じ編集モーダルを開けるよう、フックとして切り出している。
export function useTaskCardActions(task: TaskWithRelations) {
  const router = useRouter();
  const [lists, setLists] = useState<FormLists | null>(null);
  const [loadingLists, setLoadingLists] = useState(false);
  const [editTask, setEditTask] = useState<TaskWithRelations | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function ensureLists(): Promise<FormLists | null> {
    if (lists) return lists;
    setLoadingLists(true);
    try {
      const [categoriesRes, staffRes, projectsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/staff"),
        fetch("/api/projects"),
      ]);
      if (!categoriesRes.ok || !staffRes.ok || !projectsRes.ok) throw new Error();
      const [{ categories }, { staff }, { projects }] = await Promise.all([
        categoriesRes.json(),
        staffRes.json(),
        projectsRes.json(),
      ]);
      const next = { categories, staff, projects };
      setLists(next);
      return next;
    } catch {
      toast.error("編集フォームの読み込みに失敗しました");
      return null;
    } finally {
      setLoadingLists(false);
    }
  }

  async function openEdit(e?: React.SyntheticEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    const l = await ensureLists();
    if (!l) return;
    setEditTask(task);
  }

  async function handleDuplicateClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDuplicating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          memo: task.memo,
          category_id: task.category_id,
          project_id: task.project_id,
          assignee_type: task.assignee_type,
          assignee_staff_id: task.assignee_staff_id,
          due_date: task.due_date,
          start_date: task.start_date,
          is_waiting: task.is_waiting,
          waiting_follow_up_date: task.waiting_follow_up_date,
          waiting_note: task.waiting_note,
          priority_level: task.priority_level,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "複製に失敗しました");
      }
      const { task: created } = await res.json();
      toast.success("タスクを複製しました");
      router.refresh();

      const l = await ensureLists();
      const fullRes = await fetch(`/api/tasks/${created.id}`);
      if (l && fullRes.ok) {
        const { task: fullTask } = await fullRes.json();
        setEditTask(fullTask);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "複製に失敗しました");
    } finally {
      setDuplicating(false);
    }
  }

  function openDeleteConfirm(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleteOpen(true);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("タスクを削除しました");
      setDeleteOpen(false);
      router.refresh();
    } catch {
      toast.error("削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  }

  const dialogs = (
    <>
      {editTask && lists && (
        <Dialog open onOpenChange={(open) => !open && setEditTask(null)}>
          <DialogContent
            className="max-h-[85vh] overflow-y-auto sm:max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <DialogHeader>
              <DialogTitle>タスク編集</DialogTitle>
            </DialogHeader>
            <TaskForm
              mode="edit"
              task={editTask}
              categories={lists.categories}
              staff={lists.staff}
              projects={lists.projects}
              onSaved={() => setEditTask(null)}
              onCancel={() => setEditTask(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>タスクを削除しますか？</DialogTitle>
            <DialogDescription>この操作は取り消せません。</DialogDescription>
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
    </>
  );

  return { openEdit, handleDuplicateClick, openDeleteConfirm, loadingLists, duplicating, dialogs };
}

export function TaskCardActions({
  task,
  openEdit,
  onDuplicate,
  onDelete,
  loadingLists,
  duplicating,
  dialogs,
}: {
  task: TaskWithRelations;
  openEdit: (e?: React.SyntheticEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  loadingLists: boolean;
  duplicating: boolean;
  dialogs: React.ReactNode;
}) {
  const [showMore, setShowMore] = useState(false);
  const [attachmentCount, setAttachmentCount] = useState<number | null>(null);

  async function toggleMore(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!showMore && attachmentCount === null) {
      try {
        const res = await fetch(`/api/attachments?task_id=${task.id}`);
        if (res.ok) {
          const { attachments } = await res.json();
          setAttachmentCount(attachments.length);
        } else {
          setAttachmentCount(0);
        }
      } catch {
        setAttachmentCount(0);
      }
    }
    setShowMore((v) => !v);
  }

  return (
    <div
      className="flex shrink-0 flex-col items-end gap-1 text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={openEdit}
          disabled={loadingLists}
          className="text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50"
        >
          編集
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          disabled={duplicating || loadingLists}
          className="text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50"
        >
          複製
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-destructive hover:underline"
        >
          削除
        </button>
        <button
          type="button"
          onClick={toggleMore}
          aria-label="その他の操作"
          className="text-muted-foreground hover:text-foreground"
        >
          ⋯
        </button>
      </div>

      {showMore && (
        <div className="flex flex-wrap items-center justify-end gap-2.5 text-muted-foreground">
          <SaveAsTemplateButton taskId={task.id} taskTitle={task.title} />
          <MakeRecurringButton taskId={task.id} taskTitle={task.title} />
          <ConvertToProjectButton
            taskId={task.id}
            taskTitle={task.title}
            subtaskCount={task.subtasks.length}
            attachmentCount={attachmentCount ?? 0}
          />
        </div>
      )}

      {dialogs}
    </div>
  );
}
