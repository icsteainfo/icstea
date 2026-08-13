import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listActiveRecurrenceSeries } from "@/lib/tasks/queries";
import { RecurrenceSeriesList } from "@/components/tasks/recurrence-series-list";
import { Button } from "@/components/ui/button";

export default async function RecurrencePage() {
  const supabase = await createClient();
  const series = await listActiveRecurrenceSeries(supabase);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">繰り返しタスク</h1>
          <p className="text-sm text-muted-foreground">
            出現する日と期限を分けて設定できます。サブタスクを設定すると毎回コピーされます。
          </p>
        </div>
        <Button render={<Link href="/recurrence/new">＋繰り返しTodoを追加</Link>} />
      </div>
      <RecurrenceSeriesList series={series} />
    </div>
  );
}
