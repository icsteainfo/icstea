"use client";

import { TaskCheckbox } from "./task-checkbox";
import { TaskCardActions, useTaskCardActions } from "./task-card-actions";
import { SubtaskMiniList } from "@/components/subtasks/subtask-mini-list";
import type { TaskWithRelations } from "@/lib/tasks/types";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

// ホーム画面用の、Google Tasksのようなコンパクトな1〜2行のTodo表示。
// チェックボックス・Todo名・期限・編集/複製/削除だけを常時表示し、
// 優先度・カテゴリー・担当者などのタグは非表示にする(データ自体は編集画面で維持)。
// サブタスクがある場合のみ「サブタスク ○/○」を展開できるようにする。
export function TaskRowCompact({ task }: { task: TaskWithRelations }) {
  const isCompleted = task.status === "completed";
  const { openEdit, handleDuplicateClick, openDeleteConfirm, loadingLists, duplicating, dialogs } =
    useTaskCardActions(task);

  return (
    <div className="border-b border-border/60 py-1.5 last:border-b-0">
      <div className="flex items-center gap-2">
        <TaskCheckbox
          taskId={task.id}
          completed={isCompleted}
          openSubtaskCount={task.subtasks.filter((s) => s.status === "open").length}
        />
        <button
          type="button"
          onClick={openEdit}
          className="min-w-0 flex-1 truncate text-left text-[15px] leading-tight"
        >
          <span className={isCompleted ? "text-muted-foreground line-through" : "text-foreground"}>
            {task.title}
          </span>
        </button>
        {task.due_date && (
          <span className="shrink-0 text-xs text-muted-foreground">{formatDate(task.due_date)}</span>
        )}
        <TaskCardActions
          task={task}
          openEdit={openEdit}
          onDuplicate={handleDuplicateClick}
          onDelete={openDeleteConfirm}
          loadingLists={loadingLists}
          duplicating={duplicating}
          dialogs={dialogs}
        />
      </div>
      {task.subtasks.length > 0 && <SubtaskMiniList subtasks={task.subtasks} />}
    </div>
  );
}
