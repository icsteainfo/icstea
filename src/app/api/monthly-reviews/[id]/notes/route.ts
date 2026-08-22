import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateMonthlyReviewNotes } from "@/lib/monthly-review/queries";
import { monthlyReviewNotesUpdateSchema } from "@/lib/validation/monthly-review";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json();
  const parsed = monthlyReviewNotesUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const review = await updateMonthlyReviewNotes(
    supabase,
    id,
    parsed.data.meeting_notes ?? null,
  );
  return NextResponse.json({ review });
}
