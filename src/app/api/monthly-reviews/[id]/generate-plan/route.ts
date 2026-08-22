import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateManagementPlan } from "@/lib/ai/monthly-review";
import {
  getMonthlyReview,
  listRecentMonthlyReviewsBefore,
  updateMonthlyReviewPlan,
} from "@/lib/monthly-review/queries";

type Params = { params: Promise<{ id: string }> };

// 経営プラン生成時に参考として渡す、過去何か月分の損益データを見るか
const PREVIOUS_MONTHS_FOR_CONTEXT = 3;

export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const review = await getMonthlyReview(supabase, id);
  if (!review) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }
  if (review.pl_line_items.length === 0 && !review.meeting_notes?.trim()) {
    return NextResponse.json(
      { error: "損益データかMTGメモのどちらかを入力してから作成してください" },
      { status: 400 },
    );
  }

  const previousReviews = await listRecentMonthlyReviewsBefore(
    supabase,
    review.month,
    PREVIOUS_MONTHS_FOR_CONTEXT,
  );

  const plan = await generateManagementPlan({
    month: review.month,
    plLineItems: review.pl_line_items,
    meetingNotes: review.meeting_notes ?? "",
    previousReviews: previousReviews.map((r) => ({
      month: r.month,
      plLineItems: r.pl_line_items,
    })),
  });

  const updated = await updateMonthlyReviewPlan(supabase, id, plan);
  return NextResponse.json({ review: updated });
}
