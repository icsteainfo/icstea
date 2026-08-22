import { createClient } from "@/lib/supabase/server";
import { listCategories, listStaff } from "@/lib/tasks/queries";
import { listProjects } from "@/lib/projects/queries";
import { TaskForm } from "@/components/tasks/task-form";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const [categories, staff, projects] = await Promise.all([
    listCategories(supabase),
    listStaff(supabase),
    listProjects(supabase),
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">タスク追加</h1>
      <TaskForm
        mode="create"
        categories={categories}
        staff={staff}
        projects={projects}
        defaultProjectId={params.project_id}
      />
    </div>
  );
}
