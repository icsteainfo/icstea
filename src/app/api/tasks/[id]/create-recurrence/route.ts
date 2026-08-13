import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRecurrenceSeriesFromTask } from "@/lib/tasks/queries";
import { createRecurrenceSeriesFromTaskSchema } from "@/lib/validation/recurrence";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json();
  const parsed = createRecurrenceSeriesFromTaskSchema.safeParse({ ...json, task_id: id });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const series = await createRecurrenceSeriesFromTask(supabase, id, parsed.data);

  return NextResponse.json({ series }, { status: 201 });
}
