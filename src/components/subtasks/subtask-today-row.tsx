"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import type { SubtaskWithRelations } from "@/lib/subtasks/types";
import type { TaskWithRelations } from "@/lib/tasks/types";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

// ホーム画面「要対応」で、大項目の期限に関わらず
// 期限が今日までのサブタスクだけを、どの大項目に属するか分かる形でコンパクトに表示する
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
    <div className="flex items-center gap-2 border-b border-border/60 py-1.5 last:border-b-0">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={(v) => handleToggle(v === true)}
        aria-label={isCompleted ? "未完了に戻す" : "完了にする"}
      />
      <div className="min-w-0 flex-1 truncate text-left text-[15px] leading-tight">
        <span className="text-xs text-muted-foreground">{parentTask.title} ・ </span>
        <span className={isCompleted ? "text-muted-foreground line-through" : "text-foreground"}>
          {subtask.title}
        </span>
      </div>
      {subtask.due_date && (
        <span className="shrink-0 text-xs text-muted-foreground">{formatDate(subtask.due_date)}</span>
      )}
    </div>
  );
}
