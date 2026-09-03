import { TaskRowCompact } from "@/components/tasks/task-row-compact";
import { HomeSection, type HomeSectionTint } from "./section";
import type { TaskWithRelations } from "@/lib/tasks/types";

const EMPTY_MESSAGES: Record<string, string> = {
  今週: "今週期限のタスクはありません",
  今月: "今月期限のタスクはありません",
  期限未定: "期限未定のタスクはありません",
  完了済み: "完了済みのタスクはありません",
};

const TITLE_TINT: Record<string, HomeSectionTint> = {
  今週: "pink",
  今月: "blue",
  期限未定: "lavender",
  完了済み: "yellow",
};

// 今週・今月・期限未定は、ホームを開いた時点で全体像が見えるよう最初から開いた状態にする。
// 完了済みは頻繁に見るものではないため、従来通り閉じた状態から始める。
const DEFAULT_OPEN: Record<string, boolean> = {
  今週: true,
  今月: true,
  期限未定: true,
  完了済み: false,
};

export function OtherTasksSection({
  title,
  tasks,
}: {
  title: "今週" | "今月" | "期限未定" | "完了済み";
  tasks: TaskWithRelations[];
}) {
  return (
    <HomeSection
      title={title}
      emptyMessage={EMPTY_MESSAGES[title]}
      count={tasks.length}
      collapsible
      defaultOpen={DEFAULT_OPEN[title]}
      tint={TITLE_TINT[title]}
    >
      <div>
        {tasks.map((task) => (
          <TaskRowCompact key={task.id} task={task} />
        ))}
      </div>
    </HomeSection>
  );
}
