import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { computeReorderStatus, computeUsageStats } from "@/lib/inventory/reorder";
import { CreateReorderTaskButton } from "@/components/inventory/create-reorder-task-button";
import { CloudMotif } from "./motifs";
import type { ProductWithStock } from "@/lib/inventory/types";

export function InventoryAlertSection({
  products,
}: {
  products: ProductWithStock[];
}) {
  const needsReorder = products
    .map((product) => ({
      product,
      status: computeReorderStatus(product, computeUsageStats(product)),
    }))
    .filter((entry) => entry.status.needsReorder);

  return (
    <section className="shadow-dreamy relative isolate rounded-3xl border-2 border-tint-blue-line bg-tint-blue p-4">
      <CloudMotif className="pop-motif -top-1 -right-2 size-10 text-[#9DDBF5] opacity-80" />
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          在庫・発注
          {needsReorder.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {needsReorder.length}件
            </span>
          )}
        </h2>
        <Link href="/costing/materials" className="text-sm text-muted-foreground hover:underline">
          在庫一覧を見る
        </Link>
      </div>

      {needsReorder.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card py-6 text-center text-sm text-muted-foreground">
          現在、発注が必要な商品はありません
        </p>
      ) : (
        <div className="space-y-2">
          {needsReorder.map(({ product, status }) => {
            const severe = status.urgency === "below_safety_stock";
            return (
              <div
                key={product.id}
                className={
                  severe
                    ? "flex flex-col gap-2 rounded-2xl border-2 border-destructive/50 bg-destructive/8 p-3 sm:flex-row sm:items-center sm:justify-between"
                    : "flex flex-col gap-2 rounded-2xl border-2 border-warning/50 bg-warning/12 p-3 sm:flex-row sm:items-center sm:justify-between"
                }
              >
                <Link href={`/products/${product.id}`} className="space-y-1 hover:underline">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{product.name}</p>
                    <Badge
                      variant="destructive"
                      className={
                        severe ? undefined : "bg-warning/15 text-warning dark:bg-warning/25"
                      }
                    >
                      {severe ? "⚠️ 安全在庫割れ" : "発注が必要"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{status.reason}</p>
                </Link>
                <CreateReorderTaskButton productId={product.id} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
