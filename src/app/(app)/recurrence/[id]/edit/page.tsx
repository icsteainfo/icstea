import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecurrenceSeries, listCategories, listStaff } from "@/lib/tasks/queries";
import { RecurrenceSeriesForm } from "@/components/tasks/recurrence-series-form";

export default async function EditRecurrenceSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [series, categories, staff] = await Promise.all([
    getRecurrenceSeries(supabase, id),
    listCategories(supabase),
    listStaff(supabase),
  ]);

  if (!series) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">繰り返しTodoを編集</h1>
        <p className="text-sm text-muted-foreground">
          「Todoが出現する日」と「期限」を分けて設定できます。サブタスクを設定すると、毎回自動でコピーされます。
        </p>
      </div>
      <RecurrenceSeriesForm categories={categories} staff={staff} initial={series} />
    </div>
  );
}
