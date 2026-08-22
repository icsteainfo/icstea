import { createClient } from "@/lib/supabase/server";
import { listMonthlyReviews } from "@/lib/monthly-review/queries";
import { CreateReviewForm } from "@/components/monthly-review/create-review-form";
import { ReviewList } from "@/components/monthly-review/review-list";

export default async function MonthlyReviewPage() {
  const supabase = await createClient();
  const reviews = await listMonthlyReviews(supabase);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">月次経営MTG</h1>
        <p className="text-sm text-muted-foreground">
          毎月の損益表の写真と、社長・経理とのMTGの内容を記録し、AIが次月以降の経営プランを提案します。
        </p>
      </div>

      <CreateReviewForm />

      <ReviewList reviews={reviews} />
    </div>
  );
}
