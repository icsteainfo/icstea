import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { computeManagementSummary } from "@/lib/monthly-review/summary";
import type { MonthlyReview } from "@/lib/monthly-review/types";

function formatMonthLabel(month: string) {
  const [y, m] = month.split("-");
  return `${y}年${Number(m)}月`;
}

function formatSignedYen(amount: number) {
  const rounded = Math.round(amount);
  const abs = Math.abs(rounded).toLocaleString("ja-JP");
  return rounded < 0 ? `▲¥${abs}` : `¥${abs}`;
}

function formatRate(rate: number | null) {
  if (rate === null) return "—";
  const abs = Math.abs(rate).toFixed(1);
  return rate < 0 ? `▲${abs}%` : `${abs}%`;
}

export function ReviewList({ reviews }: { reviews: MonthlyReview[] }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
        まだ記録がありません。上のフォームから今月分を作成してください。
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {reviews.map((review) => {
        const summary = computeManagementSummary(review.pl_line_items);
        const hasPl = review.pl_line_items.length > 0;
        const hasNotes = !!review.meeting_notes?.trim();
        const hasPlan = !!review.ai_plan;

        return (
          <Link
            key={review.id}
            href={`/monthly-review/${review.id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background p-3 hover:bg-muted/50"
          >
            <div className="space-y-1">
              <p className="font-medium">{formatMonthLabel(review.month)}</p>
              {hasPl && (
                <p className="text-sm text-muted-foreground">
                  利益 {formatSignedYen(summary.profit)}({formatRate(summary.profitRate)})
                </p>
              )}
            </div>
            <div className="flex gap-1.5">
              <Badge variant={hasPl ? "default" : "outline"}>損益表</Badge>
              <Badge variant={hasNotes ? "default" : "outline"}>MTGメモ</Badge>
              <Badge variant={hasPlan ? "default" : "outline"}>経営プラン</Badge>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
