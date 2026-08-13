"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/marketing/types";
import { formatPercent, formatYen } from "@/lib/sales/format";
import type { CampaignImpact } from "@/lib/marketing/analysis";
import type { MarketingCampaignWithMenuItem } from "@/lib/marketing/types";

export function CampaignList({
  entries,
}: {
  entries: { campaign: MarketingCampaignWithMenuItem; impact: CampaignImpact }[];
}) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("この施策記録を削除しますか？")) return;
    try {
      const res = await fetch(`/api/marketing/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      toast.success("削除しました");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    }
  }

  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
        まだ施策が記録されていません。上のフォームから記録してください。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(({ campaign, impact }) => (
        <div key={campaign.id} className="space-y-2 rounded-lg border p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  {CAMPAIGN_TYPE_LABELS[campaign.type]}
                </span>
                <span className="text-sm text-muted-foreground">{campaign.date}</span>
              </div>
              <p className="mt-1 text-sm">
                対象: {campaign.menu_item_name ?? "店舗全体"}
                {campaign.ad_cost !== null && ` / 広告費 ${formatYen(campaign.ad_cost)}`}
              </p>
              {campaign.memo && (
                <p className="mt-1 text-sm text-muted-foreground">{campaign.memo}</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(campaign.id)}
            >
              削除
            </Button>
          </div>

          <div className="rounded-md bg-muted/40 p-3 text-sm">
            {impact.beforeDaysWithData === 0 && impact.afterDaysWithData === 0 ? (
              <p className="text-muted-foreground">
                前後{impact.windowDays}日間に売上データがないため、効果を比較できません。
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                {impact.beforeAvgQuantity !== null && impact.afterAvgQuantity !== null && (
                  <span>
                    平均販売数: {impact.beforeAvgQuantity.toFixed(1)}個/日 →{" "}
                    {impact.afterAvgQuantity.toFixed(1)}個/日
                    <span className="ml-1 text-muted-foreground">
                      ({formatPercent(impact.quantityChangeRate)})
                    </span>
                  </span>
                )}
                <span>
                  平均売上: {impact.beforeAvgGross !== null ? formatYen(impact.beforeAvgGross) : "-"}/日 →{" "}
                  {impact.afterAvgGross !== null ? formatYen(impact.afterAvgGross) : "-"}/日
                  <span className="ml-1 text-muted-foreground">
                    ({formatPercent(impact.grossChangeRate)})
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
