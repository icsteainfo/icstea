import { createClient } from "@/lib/supabase/server";
import { listCategories, listStaff } from "@/lib/tasks/queries";
import { RecurrenceSeriesForm } from "@/components/tasks/recurrence-series-form";

export default async function NewRecurrenceSeriesPage() {
  const supabase = await createClient();
  const [categories, staff] = await Promise.all([
    listCategories(supabase),
    listStaff(supabase),
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">繰り返しTodoを追加</h1>
        <p className="text-sm text-muted-foreground">
          「Todoが出現する日」と「期限」を分けて設定できます。サブタスクを設定すると、毎回自動でコピーされます。
        </p>
      </div>
      <RecurrenceSeriesForm categories={categories} staff={staff} />
    </div>
  );
}
