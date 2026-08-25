"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { SubtaskWithRelations } from "@/lib/subtasks/types";
import type { TaskWithRelations } from "@/lib/tasks/types";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

// ホーム画面「今日やること」で、大項目の期限に関わらず
// 期限が今日までのサブタスクだけを、どの大項目に属するか分かる形で表示する
export function SubtaskTodayRow({
  subtask,
  parentTask,
}: {
  subtask: SubtaskWithRelations;
  parentTask: TaskWithRelations;
}) {
  const router = useRouter();
  const isCompleted = subtask.status === "completed";

  async function handleToggle(completed: boolean) {
    try {
      const res = await fetch(`/api/subtasks/${subtask.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("更新に失敗しました");
    }
  }

  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="mb-1 truncate text-xs text-muted-foreground">{parentTask.title}</p>
      <div className="flex items-start gap-3 pl-3">
        <div className="pt-1">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={(v) => handleToggle(v === true)}
            aria-label={isCompleted ? "未完了に戻す" : "完了にする"}
          />
        </div>
        <div className="flex-1 space-y-1">
          <p
            className={
              isCompleted
                ? "text-sm text-muted-foreground line-through"
                : "text-sm font-medium"
            }
          >
            └ {subtask.title}
          </p>
          <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
            {subtask.due_date && (
              <Badge variant="outline">期限: {formatDate(subtask.due_date)}</Badge>
            )}
            <Badge variant="outline">担当: {subtask.assignee_name}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
