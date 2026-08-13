import Link from "next/link";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { HomeSection } from "./section";
import { groupByStaff } from "@/lib/tasks/classify";
import type { TaskWithRelations } from "@/lib/tasks/types";

export function DelegatedSection({ tasks }: { tasks: TaskWithRelations[] }) {
  const groups = groupByStaff(tasks);

  return (
    <HomeSection
      title="スタッフへ委任中"
      description="スタッフに任せているタスクです"
      emptyMessage="現在、スタッフに委任しているタスクはありません"
      count={tasks.length}
      collapsible
      defaultOpen
      tint="lavender"
    >
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.staffId} className="space-y-2">
            <Link
              href={`/staff/${group.staffId}`}
              className="text-sm font-medium text-muted-foreground hover:underline"
            >
              {group.staffName}({group.tasks.length}件)
            </Link>
            <div className="space-y-2">
              {group.tasks.map((task) => (
                <TaskListItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </HomeSection>
  );
}
