import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteMonthlyReview } from "@/lib/monthly-review/queries";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  await deleteMonthlyReview(supabase, id);
  return NextResponse.json({ ok: true });
}
