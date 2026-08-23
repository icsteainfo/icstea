import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ProductUsage } from "@/lib/costing/types";

function Section({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children?: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">
        {label}({count}件)
      </p>
      {children}
    </div>
  );
}

export function ProductUsageCard({ usage }: { usage: ProductUsage }) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">使用状況</h2>
        {usage.isUnused && <Badge variant="secondary">未使用</Badge>}
      </div>
      {usage.isUnused ? (
        <p className="text-sm text-muted-foreground">
          この商品はドリンクレシピ・原価計算・在庫データのどこからも参照されていません。削除できます。
        </p>
      ) : (
        <div className="space-y-2">
          <Section label="ドリンクレシピ" count={usage.menuItemIngredients.count}>
            <div className="flex flex-wrap gap-1">
              {usage.menuItemIngredients.refs.map((ref) => (
                <Link key={ref.id} href={`/costing/menu/${ref.id}`}>
                  <Badge variant="outline">{ref.name}</Badge>
                </Link>
              ))}
            </div>
          </Section>
          <Section label="中間レシピ" count={usage.intermediateRecipeIngredients.count}>
            <div className="flex flex-wrap gap-1">
              {usage.intermediateRecipeIngredients.refs.map((ref) => (
                <Link key={ref.id} href={`/costing/recipes/${ref.id}`}>
                  <Badge variant="outline">{ref.name}</Badge>
                </Link>
              ))}
            </div>
          </Section>
          <Section label="カテゴリー初期設定(サイズ別容器設定)" count={usage.categoryDefaultVariants.count}>
            <div className="flex flex-wrap gap-1">
              {usage.categoryDefaultVariants.refs.map((ref) => (
                <Badge key={ref.id} variant="outline">
                  {ref.name}
                </Badge>
              ))}
            </div>
          </Section>
          <Section label="在庫データ" count={usage.stockSnapshots} />
          <Section label="棚卸し履歴" count={usage.inventoryCheckResults} />
          <Section label="関連タスク" count={usage.tasks} />
          <Section label="仕入価格の履歴" count={usage.priceHistory} />
        </div>
      )}
    </div>
  );
}
