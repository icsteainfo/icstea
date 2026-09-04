import { TaskRowCompact } from "@/components/tasks/task-row-compact";
import { HomeSection } from "./section";
import { IdolEmptyState } from "@/components/idol/idol-image";
import { cn } from "@/lib/utils";
import type { TaskDateGroup } from "@/lib/tasks/classify";

// ホームのTodoを、Google Tasksのように期限超過→今日→明日→個別の日付…の順で
// 日付見出しごとにまとめて表示する。期限未定・完了済みは別セクション(呼び出し側)で表示する。
export function TaskTimelineSection({ groups }: { groups: TaskDateGroup[] }) {
  const totalCount = groups.reduce((sum, group) => sum + group.tasks.length, 0);

  return (
    <HomeSection
      title="Todo"
      emptyMessage="現在、期限が設定されているタスクはありません"
      emptySlot={<IdolEmptyState message="対応待ちなし" caption="今日も順調" />}
      count={totalCount}
      tint="pink"
    >
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.key}>
            <h3
              className={cn(
                "mb-1 flex items-baseline gap-1.5 text-sm font-semibold",
                group.key === "overdue" ? "text-destructive" : "text-foreground",
              )}
            >
              {group.label}
              <span className="text-xs font-normal text-muted-foreground">
                {group.tasks.length}件
              </span>
            </h3>
            <div>
              {group.tasks.map((task) => (
                <TaskRowCompact
                  key={task.id}
                  task={task}
                  showDueDate={group.key === "overdue"}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </HomeSection>
  );
}
