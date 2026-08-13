import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProduct } from "@/lib/inventory/queries";
import { ProductForm } from "@/components/inventory/product-form";
import { DeleteProductButton } from "@/components/inventory/delete-product-button";
import { LogEventButtons } from "@/components/inventory/log-event-buttons";
import { CreateReorderTaskButton } from "@/components/inventory/create-reorder-task-button";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "記録なし";
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const product = await getProduct(supabase, id);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">商品編集</h1>
        <DeleteProductButton productId={product.id} />
      </div>
      <ProductForm mode="edit" product={product} />

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
