import { createClient } from "@/lib/supabase/server";
import { listCategories, listStaff, listTasks } from "@/lib/tasks/queries";
import { groupTasksByCategory } from "@/lib/tasks/classify";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { NewTaskMenuButton } from "@/components/tasks/new-task-menu-button";
import type { AssigneeType, TaskStatus } from "@/types/database.types";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [tasks, categories, staff] = await Promise.all([
    listTasks(supabase, {
      status: (params.status as TaskStatus) || undefined,
      categoryId: params.category_id || undefined,
      assigneeType: (params.assignee_type as AssigneeType) || undefined,
      assigneeStaffId: params.assignee_staff_id || undefined,
    }),
    listCategories(supabase),
    listStaff(supabase),
  ]);

  const groups = groupTasksByCategory(tasks, categories);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">タスク一覧</h1>
        <NewTaskMenuButton />
      </div>

      <TaskFilters categories={categories} staff={staff} />

      <div className="space-y-6">
        {tasks.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            条件に一致するタスクはありません
          </p>
        )}
        {groups.map((group) => (
          <div key={group.categoryName} className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {group.categoryName}
              <span className="ml-2 font-normal">{group.tasks.length}件</span>
            </h2>
            <div className="space-y-2">
              {group.tasks.map((task) => (
                <TaskListItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
