import { TaskListItem } from "@/components/tasks/task-list-item";
import { SubtaskTodayRow } from "@/components/subtasks/subtask-today-row";
import { HomeSection } from "./section";
import type { TodayItem } from "@/lib/tasks/classify";

export function UrgentSection({ items }: { items: TodayItem[] }) {
  return (
    <div className="rounded-xl border-2 border-destructive/40 bg-destructive/5 p-4">
      <HomeSection
        title="⚠️ 要対応"
        description="期限超過・本日期限・優先度が緊急のもの、今日やるべきことをまとめて表示しています"
        emptyMessage="現在、対応が必要なタスクはありません"
        count={items.length}
      >
        {items.map((item) =>
          item.kind === "task" ? (
            <TaskListItem key={`task-${item.task.id}`} task={item.task} />
          ) : (
            <SubtaskTodayRow
              key={`subtask-${item.subtask.id}`}
              subtask={item.subtask}
              parentTask={item.parentTask}
            />
          ),
        )}
      </HomeSection>
    </div>
  );
}
