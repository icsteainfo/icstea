import { TaskListItem } from "@/components/tasks/task-list-item";
import { SubtaskTodayRow } from "@/components/subtasks/subtask-today-row";
import { HomeSection } from "./section";
import { StarMotif } from "./motifs";
import type { TodayItem } from "@/lib/tasks/classify";

export function UrgentSection({ items }: { items: TodayItem[] }) {
  return (
    <div className="shadow-dreamy relative isolate rounded-3xl border-2 border-destructive/50 bg-destructive/8 p-4">
      <StarMotif className="pop-motif pop-twinkle -top-2 -right-2 size-8 text-destructive/70" />
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
