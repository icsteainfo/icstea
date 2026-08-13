import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { computeReorderStatus, computeUsageStats } from "@/lib/inventory/reorder";
import { formatNumber } from "@/lib/format";
import type { ProductWithStock } from "@/lib/inventory/types";

const URGENCY_BADGE: Record<
  ReturnType<typeof computeReorderStatus>["urgency"],
  { label: string; variant: "destructive" | "default" | "outline" } | null
> = {
  below_safety_stock: { label: "⚠️ 安全在庫割れ", variant: "destructive" },
  reorder_soon: { label: "発注が必要", variant: "destructive" },
  watch: { label: "様子見", variant: "outline" },
  none: null,
};

export function ProductStockRow({ product }: { product: ProductWithStock }) {
  const usage = computeUsageStats(product);
  const status = computeReorderStatus(product, usage);
  const badge = URGENCY_BADGE[status.urgency];
  const current = product.latest_snapshot?.quantity ?? null;
  const previous = product.previous_snapshot?.quantity ?? null;
  const diff = current !== null && previous !== null ? current - previous : null;

  return (
    <Link
      href={`/products/${product.id}`}
      className="flex flex-col gap-2 rounded-lg border bg-background p-3 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
      style={
        product.display_color
          ? {
              borderColor: product.display_color,
              backgroundColor: `${product.display_color}33`,
            }
          : undefined
      }
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{product.name}</p>
          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{status.reason}</p>
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
        <Badge variant="outline">
          現在庫: {current !== null ? `${formatNumber(current)}${product.unit}` : "未記録"}
        </Badge>
        {diff !== null && diff > 0 && (
          <Badge variant="outline">
            📦 入荷の可能性(前回比 +{formatNumber(diff)}{product.unit})
          </Badge>
        )}
        {diff !== null && diff <= 0 && (
          <Badge variant="outline">
            前回比: {formatNumber(diff)}
            {product.unit}
          </Badge>
        )}
        {usage.daysRemaining !== null && (
          <Badge variant="outline">
            残り約{Math.round(usage.daysRemaining)}日分
          </Badge>
        )}
      </div>
    </Link>
  );
}
