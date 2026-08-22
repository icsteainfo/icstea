import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMonthlyReview } from "@/lib/monthly-review/queries";
import { PlSection } from "@/components/monthly-review/pl-section";
import { NotesSection } from "@/components/monthly-review/notes-section";
import { PlanSection } from "@/components/monthly-review/plan-section";
import { DeleteReviewButton } from "@/components/monthly-review/delete-review-button";

function formatMonthLabel(month: string) {
  const [y, m] = month.split("-");
  return `${y}年${Number(m)}月`;
}

export default async function MonthlyReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const review = await getMonthlyReview(supabase, id);
  if (!review) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{formatMonthLabel(review.month)}の経営MTG</h1>
        <DeleteReviewButton reviewId={review.id} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">① 損益表</h2>
        <p className="text-sm text-muted-foreground">
          損益表の写真かPDFをアップロードすると、AIが項目と金額を読み取ります(可能ならPDFの方が読み取り精度が高くなります)。読み取り後の内容は自由に編集できます。
        </p>
        <PlSection review={review} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">② MTGで話した内容</h2>
        <NotesSection reviewId={review.id} initialNotes={review.meeting_notes} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">③ 経営プラン</h2>
        <p className="text-sm text-muted-foreground">
          ①・②の内容をもとに、AIが現状の整理と来月以降のアクションプランを提案します。
        </p>
        <PlanSection review={review} />
      </section>
    </div>
  );
}
