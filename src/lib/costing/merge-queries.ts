import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { deactivateProductGuarded } from "@/lib/inventory/queries";
import type { ProductUsage } from "./types";

type Client = SupabaseClient<Database>;

export type MergeProductsResult =
  | {
      ok: true;
      stockSnapshotsMoved: number;
      stockSnapshotsSkipped: number;
      inventoryCheckResultsMoved: number;
      inventoryCheckResultsSkipped: number;
    }
  | { ok: false; reason: "still-in-use"; usage: ProductUsage };

// stock_snapshotsは(product_id, recorded_on)がユニークなので、日付の重複を避けながら
// sourceからtargetへ付け替える。targetに既にその日付のデータがある場合はtarget側を優先し、
// source側の行は削除する(在庫記録が二重に残らないようにするため)。
async function repointStockSnapshots(
  supabase: Client,
  sourceId: string,
  targetId: string,
): Promise<{ moved: number; skipped: number }> {
  const [{ data: targetRows, error: targetError }, { data: sourceRows, error: sourceError }] =
    await Promise.all([
      supabase.from("stock_snapshots").select("id, recorded_on").eq("product_id", targetId),
      supabase.from("stock_snapshots").select("id, recorded_on").eq("product_id", sourceId),
    ]);
  if (targetError) throw targetError;
  if (sourceError) throw sourceError;

  const targetDates = new Set((targetRows ?? []).map((row) => row.recorded_on));
  const moveableIds = (sourceRows ?? []).filter((row) => !targetDates.has(row.recorded_on)).map((r) => r.id);
  const conflictingIds = (sourceRows ?? []).filter((row) => targetDates.has(row.recorded_on)).map((r) => r.id);

  if (moveableIds.length > 0) {
    const { error } = await supabase
      .from("stock_snapshots")
      .update({ product_id: targetId })
      .in("id", moveableIds);
    if (error) throw error;
  }
  if (conflictingIds.length > 0) {
    const { error } = await supabase.from("stock_snapshots").delete().in("id", conflictingIds);
    if (error) throw error;
  }

  return { moved: moveableIds.length, skipped: conflictingIds.length };
}

// inventory_check_resultsは(checked_on, product_id)がユニークなので、同じ考え方で付け替える。
async function repointInventoryCheckResults(
  supabase: Client,
  sourceId: string,
  targetId: string,
): Promise<{ moved: number; skipped: number }> {
  const [{ data: targetRows, error: targetError }, { data: sourceRows, error: sourceError }] =
    await Promise.all([
      supabase.from("inventory_check_results").select("id, checked_on").eq("product_id", targetId),
      supabase.from("inventory_check_results").select("id, checked_on").eq("product_id", sourceId),
    ]);
  if (targetError) throw targetError;
  if (sourceError) throw sourceError;

  const targetDates = new Set((targetRows ?? []).map((row) => row.checked_on));
  const moveableIds = (sourceRows ?? []).filter((row) => !targetDates.has(row.checked_on)).map((r) => r.id);
  const conflictingIds = (sourceRows ?? []).filter((row) => targetDates.has(row.checked_on)).map((r) => r.id);

  if (moveableIds.length > 0) {
    const { error } = await supabase
      .from("inventory_check_results")
      .update({ product_id: targetId })
      .in("id", moveableIds);
    if (error) throw error;
  }
  if (conflictingIds.length > 0) {
    const { error } = await supabase.from("inventory_check_results").delete().in("id", conflictingIds);
    if (error) throw error;
  }

  return { moved: moveableIds.length, skipped: conflictingIds.length };
}

// recipe_category_default_variantsは1行にカップ/蓋/ストロー/スリーブの4列があるため、列ごとに付け替える。
async function repointCategoryDefaultVariants(
  supabase: Client,
  sourceId: string,
  targetId: string,
): Promise<void> {
  const { error: cupError } = await supabase
    .from("recipe_category_default_variants")
    .update({ cup_product_id: targetId })
    .eq("cup_product_id", sourceId);
  if (cupError) throw cupError;

  const { error: lidError } = await supabase
    .from("recipe_category_default_variants")
    .update({ lid_product_id: targetId })
    .eq("lid_product_id", sourceId);
  if (lidError) throw lidError;

  const { error: strawError } = await supabase
    .from("recipe_category_default_variants")
    .update({ straw_product_id: targetId })
    .eq("straw_product_id", sourceId);
  if (strawError) throw strawError;

  const { error: sleeveError } = await supabase
    .from("recipe_category_default_variants")
    .update({ sleeve_product_id: targetId })
    .eq("sleeve_product_id", sourceId);
  if (sleeveError) throw sleeveError;
}

// 重複商品の統合。sourceに紐づくレシピ・カテゴリー初期設定・在庫データ・履歴などを
// すべてtargetへ付け替えたうえで、参照が残っていないことを確認してからsourceを削除する。
// 物理削除は行わず、is_active=falseにしてmerged_into_product_idでtargetを指す
// (スプレッドシート同期が同名商品を再生成しないようにするため)。
export async function mergeProducts(
  supabase: Client,
  sourceId: string,
  targetId: string,
): Promise<MergeProductsResult> {
  if (sourceId === targetId) {
    throw new Error("統合元と統合先が同じ商品です");
  }

  const { error: menuItemIngError } = await supabase
    .from("menu_item_ingredients")
    .update({ product_id: targetId })
    .eq("product_id", sourceId);
  if (menuItemIngError) throw menuItemIngError;

  const { error: recipeIngError } = await supabase
    .from("intermediate_recipe_ingredients")
    .update({ product_id: targetId })
    .eq("product_id", sourceId);
  if (recipeIngError) throw recipeIngError;

  await repointCategoryDefaultVariants(supabase, sourceId, targetId);

  const { error: taskError } = await supabase
    .from("tasks")
    .update({ related_product_id: targetId })
    .eq("related_product_id", sourceId);
  if (taskError) throw taskError;

  const { error: priceHistoryError } = await supabase
    .from("raw_material_price_history")
    .update({ product_id: targetId })
    .eq("product_id", sourceId);
  if (priceHistoryError) throw priceHistoryError;

  const stockResult = await repointStockSnapshots(supabase, sourceId, targetId);
  const inventoryCheckResult = await repointInventoryCheckResults(supabase, sourceId, targetId);

  const deactivateResult = await deactivateProductGuarded(supabase, sourceId);
  if (!deactivateResult.ok) {
    return { ok: false, reason: "still-in-use", usage: deactivateResult.usage };
  }

  const { error: markMergedError } = await supabase
    .from("products")
    .update({ merged_into_product_id: targetId })
    .eq("id", sourceId);
  if (markMergedError) throw markMergedError;

  return {
    ok: true,
    stockSnapshotsMoved: stockResult.moved,
    stockSnapshotsSkipped: stockResult.skipped,
    inventoryCheckResultsMoved: inventoryCheckResult.moved,
    inventoryCheckResultsSkipped: inventoryCheckResult.skipped,
  };
}
