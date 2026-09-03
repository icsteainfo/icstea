import { createClient } from "@/lib/supabase/server";
import { listCategories, listStaff } from "@/lib/tasks/queries";
import { listInitiatives } from "@/lib/initiatives/queries";
import { TaskForm } from "@/components/tasks/task-form";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const [categories, staff, initiatives] = await Promise.all([
    listCategories(supabase),
    listStaff(supabase),
    listInitiatives(supabase),
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">タスク追加</h1>
      <TaskForm
        mode="create"
        categories={categories}
        staff={staff}
        initiatives={initiatives}
        defaultInitiativeId={params.initiative_id}
      />
    </div>
  );
}
