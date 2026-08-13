import { TaskListItem } from "@/components/tasks/task-list-item";
import { HomeSection } from "./section";
import type { TaskWithRelations } from "@/lib/tasks/types";

export function WaitingSection({ tasks }: { tasks: TaskWithRelations[] }) {
  return (
    <HomeSection
      title="対応待ち"
      description="相手の返信待ちなど、今こちらで作業する必要がないものです"
      emptyMessage="対応待ちのタスクはありません"
      count={tasks.length}
      collapsible
      defaultOpen
      tint="lavender"
    >
      {tasks.map((task) => (
        <TaskListItem key={task.id} task={task} />
      ))}
    </HomeSection>
  );
}
