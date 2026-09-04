import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { ProductInput, ProductUpdateInput } from "@/lib/validation/product";
import { getProductUsage } from "@/lib/costing/product-usage";
import type { ProductUsage } from "@/lib/costing/types";
import type { Product } from "./types";

type Client = SupabaseClient<Database>;

export async function listProducts(
  supabase: Client,
  options: { activeOnly?: boolean } = {},
): Promise<Product[]> {
  let query = supabase.from("products").select("*").order("sort_order");
  if (options.activeOnly !== false) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as Product[];
}

export async function getProduct(
  supabase: Client,
  id: string,
): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Product | null;
}

export async function createProduct(
  supabase: Client,
  input: ProductInput,
): Promise<Product> {
  const today = new Date().toISOString().slice(0, 10);
  const payload: Database["public"]["Tables"]["products"]["Insert"] =
    input.purchase_price != null && input.package_amount != null
      ? { ...input, price_updated_at: today }
      : input;

  const { data, error } = await supabase
    .from("products")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  const product = data as unknown as Product;

  if (input.purchase_price != null && input.package_amount != null) {
    await recordPriceHistory(supabase, product.id, input.purchase_price, input.package_amount);
  }

  return product;
}

export async function updateProduct(
  supabase: Client,
  id: string,
  input: ProductUpdateInput,
): Promise<Product> {
  const priceChanging =
    input.purchase_price !== undefined || input.package_amount !== undefined;

  let payload: Database["public"]["Tables"]["products"]["Update"] = input;
  if (priceChanging) {
    const current = await getProduct(supabase, id);
    const nextPurchasePrice =
      input.purchase_price !== undefined
        ? input.purchase_price
        : (current?.purchase_price ?? null);
    const nextPackageAmount =
      input.package_amount !== undefined
        ? input.package_amount
        : (current?.package_amount ?? null);

    if (nextPurchasePrice != null && nextPackageAmount != null) {
      const today = new Date().toISOString().slice(0, 10);
      payload = { ...input, price_updated_at: today };
    }
  }

  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  const product = data as unknown as Product;

  if (
    priceChanging &&
    product.purchase_price != null &&
    product.package_amount != null
  ) {
    await recordPriceHistory(
      supabase,
      product.id,
      product.purchase_price,
      product.package_amount,
    );
  }

  return product;
}

// 仕入価格・内容量が変わるたびに、その時点の単価を履歴として残す
// (「牛乳は2026年8月時点でいくらだったか」を後から振り返れるようにするため)。
async function recordPriceHistory(
  supabase: Client,
  productId: string,
  purchasePrice: number,
  packageAmount: number,
): Promise<void> {
  if (packageAmount === 0) return;
  const { error } = await supabase.from("raw_material_price_history").insert({
    product_id: productId,
    purchase_price: purchasePrice,
    package_amount: packageAmount,
    unit_cost: purchasePrice / packageAmount,
  });
  if (error) throw error;
}

export async function deactivateProduct(
  supabase: Client,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}

// レシピ・カテゴリー初期設定・在庫データなどから使用中の商品は、参照先を残したまま
// 削除できないようにする(統合したい場合はmergeProductsで参照を付け替えてから呼ばれる)。
export async function deactivateProductGuarded(
  supabase: Client,
  id: string,
): Promise<{ ok: true } | { ok: false; usage: ProductUsage }> {
  const usage = await getProductUsage(supabase, id);
  if (!usage.isUnused) {
    return { ok: false, usage };
  }
  await deactivateProduct(supabase, id);
  return { ok: true };
}

// 原価計算(「原材料・資材」一覧)に表示するかどうかを一括切り替える。
// 商品マスタ・在庫管理からは削除しない(is_activeとは独立したフラグ)。
export async function setProductsCostingVisibility(
  supabase: Client,
  ids: string[],
  show: boolean,
): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from("products")
    .update({ show_in_costing: show })
    .in("id", ids);
  if (error) throw error;
}

// 「原材料・資材」一覧(カテゴリー内)での並び替え専用。
// sort_orderはスプレッドシート同期で上書きされるため、別の列を使う。
export async function reorderMaterials(
  supabase: Client,
  orderedIds: string[],
): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("products").update({ material_sort_order: index }).eq("id", id),
    ),
  );
}

// 「発注した」「入荷した」を記録する(今日の日付を最終発注日/最終入荷日として保存)。
export async function logProductEvent(
  supabase: Client,
  id: string,
  type: "ordered" | "received",
  onDate: string,
): Promise<Product> {
  const patch =
    type === "ordered"
      ? { last_ordered_at: onDate }
      : { last_received_at: onDate };
  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Product;
}

