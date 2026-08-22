import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateMonthlyReviewPl } from "@/lib/monthly-review/queries";
import { monthlyReviewPlUpdateSchema } from "@/lib/validation/monthly-review";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json();
  const parsed = monthlyReviewPlUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const review = await updateMonthlyReviewPl(supabase, id, {
    pl_image_storage_path: parsed.data.pl_image_storage_path ?? null,
    pl_image_file_name: parsed.data.pl_image_file_name ?? null,
    pl_line_items: parsed.data.pl_line_items,
  });
  return NextResponse.json({ review });
}
