import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProduct, listProducts } from "@/lib/inventory/queries";
import { getProductUsage } from "@/lib/costing/product-usage";
import { ProductForm } from "@/components/inventory/product-form";
import { DeleteProductButton } from "@/components/inventory/delete-product-button";
import { LogEventButtons } from "@/components/inventory/log-event-buttons";
import { CreateReorderTaskButton } from "@/components/inventory/create-reorder-task-button";
import { ProductUsageCard } from "@/components/costing/product-usage-card";
import { MergeProductButton } from "@/components/costing/merge-product-button";
import { CostingVisibilityToggle } from "@/components/costing/costing-visibility-toggle";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "記録なし";
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const redirectTo = from === "materials" ? "/costing/materials" : "/products";

  const supabase = await createClient();
  const [product, usage, allProducts] = await Promise.all([
    getProduct(supabase, id),
    getProductUsage(supabase, id),
    listProducts(supabase),
  ]);

  if (!product) notFound();

  if (product.merged_into_product_id) {
    const mergedInto = await getProduct(supabase, product.merged_into_product_id);
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">商品編集</h1>
        <p className="rounded-lg border bg-muted/30 p-4 text-sm">
          「{product.name}」は{mergedInto ? `「${mergedInto.name}」` : "他の商品"}に統合されました。
          {mergedInto && (
            <>
              {" "}
              <a className="underline" href={`/products/${mergedInto.id}`}>
                統合先を開く
              </a>
            </>
          )}
        </p>
      </div>
    );
  }

  const mergeCandidates = allProducts
    .filter((p) => p.id !== id)
    .map((p) => ({ id: p.id, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">商品編集</h1>
        <div className="flex gap-2">
          <MergeProductButton
            productId={product.id}
            productName={product.name}
            usage={usage}
            candidates={mergeCandidates}
            redirectTo={redirectTo}
          />
          <DeleteProductButton productId={product.id} redirectTo={redirectTo} usage={usage} />
        </div>
      </div>
      <ProductForm mode="edit" product={product} />

      <ProductUsageCard usage={usage} />

      <CostingVisibilityToggle
        productId={product.id}
        showInCosting={product.show_in_costing}
        redirectTo={redirectTo}
      />

      <div className="space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">発注・入荷の記録</h2>
        <p className="text-sm text-muted-foreground">
          最終発注日: {formatDate(product.last_ordered_at)} / 最終入荷日:{" "}
          {formatDate(product.last_received_at)}
        </p>
        <p className="text-xs text-muted-foreground">
          入荷は、スプレッドシートの数量を更新して「在庫を同期」すると、前回より増えていれば自動で記録されます。下のボタンは日付を手動で直したい場合にお使いください。
        </p>
        <LogEventButtons productId={product.id} />
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">タスクと連携</h2>
        <p className="text-sm text-muted-foreground">
          発注が必要になったら、タスク一覧に「発注する」タスクを作成できます。そのタスクを完了にすると、最終発注日が自動で記録されます。
        </p>
        <CreateReorderTaskButton productId={product.id} />
      </div>
    </div>
  );
}
