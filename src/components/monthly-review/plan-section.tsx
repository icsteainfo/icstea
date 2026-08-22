"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ManagementPlan, MonthlyReview } from "@/lib/monthly-review/types";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PlanSection({ review }: { review: MonthlyReview }) {
  const router = useRouter();
  const [plan, setPlan] = useState<ManagementPlan | null>(review.ai_plan);
  const [generatedAt, setGeneratedAt] = useState(review.ai_plan_generated_at);
  const [generating, setGenerating] = useState(false);

  const canGenerate = review.pl_line_items.length > 0 || !!review.meeting_notes?.trim();

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/monthly-reviews/${review.id}/generate-plan`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "プランの作成に失敗しました");
      }
      const body = await res.json();
      setPlan(body.review.ai_plan);
      setGeneratedAt(body.review.ai_plan_generated_at);
      toast.success("経営プランを作成しました");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "プランの作成に失敗しました");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      {!canGenerate && (
        <p className="text-sm text-muted-foreground">
          ①の損益表か②のMTGメモを入力すると、AIに経営プランを作成してもらえます。
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        {generatedAt ? (
          <p className="text-xs text-muted-foreground">
            最終作成: {formatDateTime(generatedAt)}
          </p>
        ) : (
          <span />
        )}
        <Button type="button" onClick={handleGenerate} disabled={generating || !canGenerate}>
          {generating ? "作成中..." : plan ? "プランを作り直す" : "AIに経営プランを作成してもらう"}
        </Button>
      </div>

      {plan && (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">現状</h3>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {plan.currentSituation}
            </p>
          </div>

          {plan.keyIssues.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">課題</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {plan.keyIssues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {plan.actionItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">来月以降のアクションプラン</h3>
              <div className="space-y-2">
                {plan.actionItems.map((item, i) => (
                  <div key={i} className="rounded-md bg-muted/30 p-2.5">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
