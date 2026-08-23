import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { ProductInput, ProductUpdateInput } from "@/lib/validation/product";
import { getProductUsage } from "@/lib/costing/product-usage";
import type { ProductUsage } from "@/lib/costing/types";
import type {
  InventoryCheckAlert,
  InventoryCheckResult,
  Product,
  ProductWithStock,
  StockSnapshot,
} from "./types";

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

// スプレッドシートのセルの色を、アプリの表示色として保存する(nullなら色分けなし)。
export async function setProductDisplayColor(
  supabase: Client,
  id: string,
  color: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ display_color: color })
    .eq("id", id);
  if (error) throw error;
}

// スプレッドシート上の並び順をそのままアプリの表示順にするための更新。
export async function setProductSortOrder(
  supabase: Client,
  id: string,
  sortOrder: number,
): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ sort_order: sortOrder })
    .eq("id", id);
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

// 「発注した」を記録するのと同時に、その商品にひもづく未完了の「発注する」タスクがあれば
// 完了にする(発注Todo作成・完了の仕組みをそのまま再利用するため。日付は既にlogProductEventで
// 記録済みなので、/api/tasks/[id]/complete のように再度last_ordered_atを更新することはしない)。
export async function logOrderEvent(
  supabase: Client,
  id: string,
  onDate: string,
): Promise<Product> {
  const product = await logProductEvent(supabase, id, "ordered", onDate);
  const openTask = await findOpenReorderTask(supabase, id);
  if (openTask) {
    const { error } = await supabase
      .from("tasks")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", openTask.id);
    if (error) throw error;
  }
  return product;
}

// 指定した商品名のうち、まだ商品マスタに登録されていないものを
// デフォルト値(リードタイム14日・安全在庫0)で登録する。
// 戻り値は「商品名 → 商品」のマップ(既存・新規どちらも含む)。
export async function getOrCreateProductsByName(
  supabase: Client,
  names: string[],
  category: string,
): Promise<{ byName: Map<string, Product>; addedCount: number }> {
  const { data: existing, error: fetchError } = await supabase
    .from("products")
    .select("*");
  if (fetchError) throw fetchError;

  const byName = new Map<string, Product>();
  for (const p of existing as unknown as Product[]) byName.set(p.name, p);

  const missing = names.filter((n) => !byName.has(n));
  if (missing.length > 0) {
    const { data: created, error: insertError } = await supabase
      .from("products")
      .insert(
        missing.map((name) => ({
          name,
          category,
          unit: "g",
          lead_time_days: 14,
          safety_stock: 0,
        })),
      )
      .select();
    if (insertError) throw insertError;
    for (const p of created as unknown as Product[]) byName.set(p.name, p);
  }

  return { byName, addedCount: missing.length };
}

export async function upsertStockSnapshot(
  supabase: Client,
  snapshot: {
    product_id: string;
    recorded_on: string;
    quantity: number;
    kitchen_back?: number | null;
    under_chair?: number | null;
    office?: number | null;
    warehouse?: number | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from("stock_snapshots")
    .upsert(snapshot, { onConflict: "product_id,recorded_on" });
  if (error) throw error;
}

// 商品ページから「発注する」タスクを作成する。
// カテゴリー「仕入れ・発注」を自動で紐づけ、related_product_idで商品とタスクを連携する
// (このタスクが完了すると、最終発注日が自動で更新される。lib/tasks/queries.tsのsetTaskCompletion参照)。
export async function createReorderTask(
  supabase: Client,
  productId: string,
  productName: string,
  memo?: string,
): Promise<{ id: string }> {
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("name", "仕入れ・発注")
    .maybeSingle();
  if (categoryError) throw categoryError;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: `${productName}を発注する`,
      memo: memo ?? null,
      category_id: category?.id ?? null,
      assignee_type: "owner",
      related_product_id: productId,
      priority_level: "high",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data as unknown as { id: string };
}

// 指定した商品にひもづく、未完了の発注タスクを探す(在庫チェック連携での重複作成防止に使う)。
export async function findOpenReorderTask(
  supabase: Client,
  productId: string,
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id")
    .eq("related_product_id", productId)
    .eq("status", "open")
    .maybeSingle();
  if (error) throw error;
  return data as unknown as { id: string } | null;
}

// 在庫チェックで×→⭕に変わった商品の発注タスクを自動完了する。
// 実際に発注したわけではないため、通常のタスク完了(complete API)とは違い、
// 商品の最終発注日(last_ordered_at)は更新しない。既存メモは消さず、末尾に解消理由を追記する。
export async function resolveReorderTask(
  supabase: Client,
  taskId: string,
  resolvedOn: string,
): Promise<void> {
  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("memo")
    .eq("id", taskId)
    .single();
  if (fetchError) throw fetchError;

  const resolutionNote = [
    "在庫チェックで⭕になったため自動完了",
    `解消確認日：${resolvedOn.replaceAll("-", "/")}`,
  ].join("\n");
  const memo = task.memo ? `${task.memo}\n\n${resolutionNote}` : resolutionNote;

  const { error } = await supabase
    .from("tasks")
    .update({ memo, status: "completed", completed_at: new Date().toISOString() })
    .eq("id", taskId);
  if (error) throw error;
}

// 直近の在庫チェック(最新のchecked_on)で×判定だった商品を、
// 紐づくタスクが未完了のものだけホーム画面のアラート用に取得する。
export async function listLatestInventoryCheckAlerts(
  supabase: Client,
): Promise<InventoryCheckAlert[]> {
  const { data: latest, error: latestError } = await supabase
    .from("inventory_check_results")
    .select("checked_on")
    .order("checked_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) throw latestError;
  if (!latest) return [];

  const { data, error } = await supabase
    .from("inventory_check_results")
    .select("*, tasks(status)")
    .eq("checked_on", latest.checked_on);
  if (error) throw error;

  return (data as unknown as (InventoryCheckResult & { tasks: { status: "open" | "completed" } | null })[])
    .filter((row) => !row.tasks || row.tasks.status === "open")
    .map((row) => {
      const { tasks, ...rest } = row;
      return { ...rest, task_status: tasks?.status ?? null };
    });
}

// 指定した日付より前の、各商品の最新の在庫記録を取得する。
// (「同期して入荷を自動検知する」際に、今日付けで上書きする前の値と比較するために使う)
export async function getLatestSnapshotsBefore(
  supabase: Client,
  productIds: string[],
  beforeDate: string,
): Promise<Map<string, StockSnapshot>> {
  const byProduct = new Map<string, StockSnapshot>();
  if (productIds.length === 0) return byProduct;

  const { data, error } = await supabase
    .from("stock_snapshots")
    .select("*")
    .in("product_id", productIds)
    .lt("recorded_on", beforeDate)
    .order("recorded_on", { ascending: false });
  if (error) throw error;

  for (const snap of data as unknown as StockSnapshot[]) {
    if (!byProduct.has(snap.product_id)) byProduct.set(snap.product_id, snap);
  }
  return byProduct;
}

// 各商品について、直近2回分の在庫記録(今回・前回)を取得する。
// category を指定すると、そのカテゴリーの商品だけに絞り込める
// (「在庫(茶葉)」ページに、在庫チェック連携で追加された茶葉以外の商品が並ばないようにするため)。
export async function listProductsWithLatestStock(
  supabase: Client,
  options: { category?: string } = {},
): Promise<ProductWithStock[]> {
  const products = (
    await listProducts(supabase, { activeOnly: true })
  ).filter((p) => !options.category || p.category === options.category);
  if (products.length === 0) return [];

  const { data: snapshots, error } = await supabase
    .from("stock_snapshots")
    .select("*")
    .in(
      "product_id",
      products.map((p) => p.id),
    )
    .order("recorded_on", { ascending: false });
  if (error) throw error;

  const byProduct = new Map<string, StockSnapshot[]>();
  for (const snap of snapshots as unknown as StockSnapshot[]) {
    const list = byProduct.get(snap.product_id) ?? [];
    list.push(snap);
    byProduct.set(snap.product_id, list);
  }

  return products.map((product) => {
    const list = byProduct.get(product.id) ?? [];
    return {
      ...product,
      latest_snapshot: list[0] ?? null,
      previous_snapshot: list[1] ?? null,
    };
  });
}
