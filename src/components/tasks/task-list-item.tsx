import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TaskCheckbox } from "./task-checkbox";
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

const PRIORITY_BADGE: Partial<
  Record<
    PriorityLevel,
    { label: string; variant: "destructive" | "secondary" | "outline"; className?: string }
  >
> = {
  urgent: { label: "優先度: 緊急", variant: "destructive" },
  high: {
    label: "優先度: 高",
    variant: "outline",
    className: "border-transparent bg-warning/10 text-warning dark:bg-warning/20",
  },
  medium: { label: "優先度: 中", variant: "secondary" },
  low: { label: "優先度: 低", variant: "outline" },
};

export function TaskListItem({ task }: { task: TaskWithRelations }) {
  const isCompleted = task.status === "completed";
  const priorityBadge = PRIORITY_BADGE[task.priority_level];
  const progress = computeProgress(task.progress_override, task.subtasks);

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-start gap-3">
        <div className="pt-1">
          <TaskCheckbox
            taskId={task.id}
            completed={isCompleted}
            openSubtaskCount={task.subtasks.filter((s) => s.status === "open").length}
          />
        </div>

        <Link href={`/tasks/${task.id}`} className="flex-1 space-y-1">
          <p
            className={
              isCompleted
                ? "text-muted-foreground line-through"
                : "font-medium"
            }
          >
            {task.title}
          </p>
          <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
            {progress && <ProgressBadge progress={progress} />}
            {priorityBadge && (
              <Badge variant={priorityBadge.variant} className={priorityBadge.className}>
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
            {task.category_name && (
              <Badge variant="secondary">{task.category_name}</Badge>
            )}
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
