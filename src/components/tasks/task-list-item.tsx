import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TaskCheckbox } from "./task-checkbox";
import { CategoryTag } from "./category-tag";
import { ProgressBadge } from "@/components/subtasks/progress-badge";
import { SubtaskMiniList } from "@/components/subtasks/subtask-mini-list";
import { computeProgress } from "@/lib/subtasks/progress";
import type { TaskWithRelations } from "@/lib/tasks/types";
import type { PriorityLevel } from "@/types/database.types";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

// 優先度は「用途→色」の使い分け(優先度=イエロー/ピンク系)に沿って、
// 緊急ほどはっきり強い色になるようにする
const PRIORITY_BADGE: Partial<Record<PriorityLevel, { label: string; className: string }>> = {
  urgent: {
    label: "優先度: 緊急",
    className: "border-transparent bg-destructive text-white",
  },
  high: {
    label: "優先度: 高",
    className: "border-transparent bg-[#F0B429] text-[#382B33]",
  },
  medium: {
    label: "優先度: 中",
    className: "border-tint-pink-line/60 bg-tint-pink text-foreground",
  },
  low: { label: "優先度: 低", className: "" },
};

export function TaskListItem({ task }: { task: TaskWithRelations }) {
  const isCompleted = task.status === "completed";
  const priorityBadge = PRIORITY_BADGE[task.priority_level];
  const progress = computeProgress(task.progress_override, task.subtasks);

  return (
    <div className="shadow-dreamy-sm pop-lift rounded-[22px] border-2 border-border bg-card p-4 hover:border-[color-mix(in_oklch,var(--border),var(--foreground)_12%)]">
      <div className="flex items-start gap-3">
        <div className="pt-1">
          <TaskCheckbox
            taskId={task.id}
            completed={isCompleted}
            openSubtaskCount={task.subtasks.filter((s) => s.status === "open").length}
          />
        </div>

        <Link href={`/tasks/${task.id}`} className="flex-1 space-y-1.5">
          <p
            className={
              isCompleted
                ? "text-muted-foreground line-through"
                : "font-semibold text-foreground"
            }
          >
            {task.title}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {progress && <ProgressBadge progress={progress} />}
            {priorityBadge && (
              <Badge variant="outline" className={priorityBadge.className}>
                {priorityBadge.label}
              </Badge>
            )}
            {task.due_date && task.start_date && (
              <Badge variant="outline">
                期間: {formatDate(task.start_date)}〜{formatDate(task.due_date)}
              </Badge>
            )}
            {task.due_date && !task.start_date && (
              <Badge variant="outline">期限: {formatDate(task.due_date)}</Badge>
            )}
            {task.category_name && <CategoryTag name={task.category_name} />}
            <Badge variant="outline">担当: {task.assignee_name}</Badge>
            {task.is_waiting && (
              <Badge variant="outline">
                対応待ち
                {task.waiting_follow_up_date &&
                  ` (再確認: ${formatDate(task.waiting_follow_up_date)})`}
              </Badge>
            )}
          </div>
        </Link>
      </div>

      <SubtaskMiniList subtasks={task.subtasks} />
    </div>
  );
}
