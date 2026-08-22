import { TaskListItem } from "@/components/tasks/task-list-item";
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
      defaultOpen={false}
      tint={TITLE_TINT[title]}
    >
      {tasks.map((task) => (
        <TaskListItem key={task.id} task={task} />
      ))}
    </HomeSection>
  );
}
