import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deactivateRecurrenceSeries, updateRecurrenceSeries } from "@/lib/tasks/queries";
import { recurrenceSeriesInputSchema } from "@/lib/validation/recurrence";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  await deactivateRecurrenceSeries(supabase, id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json();
  const parsed = recurrenceSeriesInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const series = await updateRecurrenceSeries(supabase, id, parsed.data);
  return NextResponse.json({ series });
}
