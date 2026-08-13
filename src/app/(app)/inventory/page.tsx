import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listProductsWithLatestStock } from "@/lib/inventory/queries";
import { SyncInventoryButton } from "@/components/inventory/sync-inventory-button";
import { ProductStockRow } from "@/components/inventory/product-stock-row";
import { Button } from "@/components/ui/button";

export default async function InventoryPage() {
  const supabase = await createClient();
  // スプレッドシート上の並び順(sort_order)のまま表示する。
  // 在庫チェック(◎/×)連携で追加された茶葉以外の商品は、このページには表示しない。
  const products = await listProductsWithLatestStock(supabase, { category: "茶葉" });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">在庫(茶葉)</h1>
          <p className="text-sm text-muted-foreground">
            スプレッドシートの在庫チェックが終わったら、下のボタンで取り込んでください。
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/products">商品マスタ</Link>} />
          <SyncInventoryButton />
        </div>
      </div>

      <div className="space-y-2">
        {products.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            商品がありません。まずスプレッドシートから在庫を取り込んでください。
          </p>
        )}
        {products.map((product) => (
          <ProductStockRow key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
