import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRecurrenceSeries, listActiveRecurrenceSeries } from "@/lib/tasks/queries";
import { generateDueRecurringInstances } from "@/lib/tasks/recurrence";
import { recurrenceSeriesInputSchema } from "@/lib/validation/recurrence";

export async function GET() {
  const supabase = await createClient();
  const series = await listActiveRecurrenceSeries(supabase);
  return NextResponse.json({ series });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json();
  const parsed = recurrenceSeriesInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const series = await createRecurrenceSeries(supabase, parsed.data);
  // 作成直後に、今日までに発生すべき最初のタスクをすぐ生成する
  await generateDueRecurringInstances(supabase);

  return NextResponse.json({ series }, { status: 201 });
}
