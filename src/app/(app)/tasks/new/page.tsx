import { createClient } from "@/lib/supabase/server";
import { listCategories, listStaff } from "@/lib/tasks/queries";
import { TaskForm } from "@/components/tasks/task-form";

export default async function NewTaskPage() {
  const supabase = await createClient();
  const [categories, staff] = await Promise.all([
    listCategories(supabase),
    listStaff(supabase),
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">タスク追加</h1>
      <TaskForm mode="create" categories={categories} staff={staff} />
    </div>
  );
}
