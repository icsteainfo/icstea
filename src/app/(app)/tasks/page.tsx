import { createClient } from "@/lib/supabase/server";
import { listCategories, listStaff, listTasks } from "@/lib/tasks/queries";
import { groupTasksByCategory } from "@/lib/tasks/classify";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { NewTaskMenuButton } from "@/components/tasks/new-task-menu-button";
import { CategoryTag } from "@/components/tasks/category-tag";
import { CharacterMascot } from "@/components/characters/character-mascot";
import { CloudMotif, HeartMotif, SparkleMotif, StarMotif } from "@/components/home/motifs";
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
    <div className="space-y-5">
      {/* ページ上部: 世界観が伝わるコンパクトなヘッダー */}
      <div className="shadow-dreamy relative isolate overflow-hidden rounded-[26px] border-2 border-tint-pink-line/50 bg-tint-pink">
        <div className="flex items-center justify-between gap-4 p-5">
          <CloudMotif className="pop-motif -top-3 -left-3 size-16 text-white/70" />
          <HeartMotif className="pop-motif pop-twinkle bottom-3 left-6 size-4 text-brand-pink/60" />
          <StarMotif className="pop-motif pop-twinkle top-3 left-24 size-3.5 text-[#A97EF0]/60" />

          <div className="relative">
            <p className="font-display text-sm font-bold tracking-wide text-brand-pink">
              TODAY&apos;S TASKS ♡
            </p>
            <h1 className="mt-0.5 flex items-center gap-1.5 text-2xl font-bold text-foreground">
              タスク一覧
              <SparkleMotif className="pop-twinkle size-4 text-[#A97EF0]" />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">今日もがんばろう ♡</p>
          </div>

          <div className="relative flex shrink-0 items-center gap-2">
            <CharacterMascot size={130} className="hidden sm:flex" />
            <NewTaskMenuButton />
          </div>
        </div>
        <div className="pop-checker h-2 w-full bg-white" aria-hidden />
      </div>

      <TaskFilters categories={categories} staff={staff} />

      <div className="space-y-6">
        {tasks.length === 0 && (
          <div className="shadow-dreamy-sm relative isolate flex flex-col items-center gap-2 rounded-[22px] border-2 border-dashed border-border bg-card py-10 text-center">
            <CloudMotif className="pop-motif top-2 right-8 size-10 text-tint-blue-line/50" />
            <HeartMotif className="size-6 text-tint-pink-line" />
            <p className="text-sm text-muted-foreground">条件に一致するタスクはありません</p>
          </div>
        )}
        {groups.map((group) => (
          <div key={group.categoryName} className="space-y-2">
            <div className="flex items-center gap-2">
              <CategoryTag name={group.categoryName} />
              <span className="text-xs font-medium text-muted-foreground">
                {group.tasks.length}件
              </span>
            </div>
            <div className="space-y-2.5">
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
