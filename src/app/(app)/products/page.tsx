import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listProducts } from "@/lib/inventory/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { unitCost } from "@/lib/costing/calculations";

export default async function ProductsPage() {
  const supabase = await createClient();
  const products = await listProducts(supabase);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">商品マスタ</h1>
          <p className="text-sm text-muted-foreground">
            リードタイム・安全在庫などの基本情報を管理します。在庫の取り込みは「在庫」画面から行います。
          </p>
        </div>
        <Button render={<Link href="/products/new">＋ 商品を追加</Link>} />
      </div>

      <div className="space-y-2">
        {products.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            商品がまだ登録されていません。「在庫」画面からスプレッドシートを取り込むと自動で追加されます。
          </p>
        )}
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3 hover:bg-muted/50"
          >
            <div className="space-y-1">
              <p className="font-medium">{product.name}</p>
              <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                <Badge variant="secondary">{product.category}</Badge>
                <Badge variant="outline">
                  リードタイム: {product.lead_time_days}日
                </Badge>
                <Badge variant="outline">
                  安全在庫: 使用量×{product.safety_stock_days}日分
                </Badge>
                <Badge variant="outline">
                  代わり値: {product.safety_stock}
                  {product.unit}
                </Badge>
                {(() => {
                  const cost = unitCost(product);
                  return cost != null ? (
                    <Badge variant="outline">
                      単価: ¥{cost.toFixed(2)}/{product.unit}
                    </Badge>
                  ) : null;
                })()}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
