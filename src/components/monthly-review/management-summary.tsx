import { computeManagementSummary } from "@/lib/monthly-review/summary";
import type { PlLineItem } from "@/lib/monthly-review/types";

// これ以上の差があれば「不整合」として警告を出す(端数程度の差は許容する)
const DISCREPANCY_TOLERANCE = 10;

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

export function ManagementSummary({ items }: { items: PlLineItem[] }) {
  const summary = computeManagementSummary(items);

  const rows = [
    { label: "原価", amount: summary.cost, rate: summary.costRate },
    { label: "人件費", amount: summary.labor, rate: summary.laborRate },
    { label: "固定費", amount: summary.fixed, rate: summary.fixedRate },
    { label: "その他経費", amount: summary.other, rate: summary.otherRate },
  ];

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="text-sm font-semibold">経営サマリー</h3>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">売上</span>
          <span className="font-medium">{formatSignedYen(summary.revenue)}</span>
        </div>
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-medium">
              {formatSignedYen(row.amount)}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                ({formatRate(row.rate)})
              </span>
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t pt-1.5">
          <span className="font-semibold">利益</span>
          <span className="font-semibold">
            {formatSignedYen(summary.profit)}
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              ({formatRate(summary.profitRate)})
            </span>
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        参考: FL比率(原価率+人件費率) {formatRate(summary.flRate)}
      </p>

      {summary.excludedLabels.length > 0 && (
        <p className="text-xs text-muted-foreground">
          小計・合計行として集計から除外: {summary.excludedLabels.join("、")}
        </p>
      )}

      {summary.referenceProfitAmount !== null && summary.profitDiscrepancy !== null && (
        <div
          className={`space-y-1 rounded-md p-2.5 text-xs ${
            Math.abs(summary.profitDiscrepancy) > DISCREPANCY_TOLERANCE
              ? "bg-destructive/10 text-destructive"
              : "bg-muted/30 text-muted-foreground"
          }`}
        >
          <p>
            検算: 損益表の{summary.referenceProfitLabel} {formatSignedYen(summary.referenceProfitAmount)} に対して、
            分類後の利益は {formatSignedYen(summary.profit)}(差額{" "}
            {formatSignedYen(summary.profitDiscrepancy)})
          </p>
          {Math.abs(summary.profitDiscrepancy) > DISCREPANCY_TOLERANCE && (
            <p>
              差額が大きいため、①読み取れていない費目がある、②受取利息・雑収入などの営業外損益が損益表にあり今回の分類に含まれていない、のいずれかの可能性があります。元の写真と①の項目一覧を見比べてご確認ください。
            </p>
          )}
        </div>
      )}
    </div>
  );
}
