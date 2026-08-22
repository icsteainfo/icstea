import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createMonthlyReview,
  getMonthlyReviewByMonth,
} from "@/lib/monthly-review/queries";
import { monthlyReviewCreateSchema } from "@/lib/validation/monthly-review";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json();
  const parsed = monthlyReviewCreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  // 同じ月がすでにあれば新規作成せず、既存のものをそのまま返す(そちらの画面へ遷移させる)
  const existing = await getMonthlyReviewByMonth(supabase, parsed.data.month);
  if (existing) {
    return NextResponse.json({ review: existing }, { status: 200 });
  }

  const review = await createMonthlyReview(supabase, parsed.data.month);
  return NextResponse.json({ review }, { status: 201 });
}
