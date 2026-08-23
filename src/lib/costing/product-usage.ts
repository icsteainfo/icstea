import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { ProductUsage, ProductUsageRef } from "./types";

type Client = SupabaseClient<Database>;

// 商品削除・統合の前に「どこで使われているか」を横断的に確認するための集計。
// ドリンクレシピ・カテゴリー初期設定・在庫データ・棚卸し履歴・その他IDを参照するデータをすべて見る。
export async function getProductUsage(supabase: Client, productId: string): Promise<ProductUsage> {
  const [
    menuItemIngredientsResult,
    intermediateRecipeIngredientsResult,
    categoryDefaultVariantsResult,
    stockSnapshotsResult,
    inventoryCheckResultsResult,
    tasksResult,
    priceHistoryResult,
  ] = await Promise.all([
    supabase
      .from("menu_item_ingredients")
      .select("menu_item_id, menu_item:menu_items(id, name)")
      .eq("product_id", productId),
    supabase
      .from("intermediate_recipe_ingredients")
      .select("intermediate_recipe_id, intermediate_recipe:intermediate_recipes(id, name)")
      .eq("product_id", productId),
    supabase
      .from("recipe_category_default_variants")
      .select(
        "id, hot_ice, size, cup_product_id, lid_product_id, straw_product_id, sleeve_product_id, category_default:recipe_category_defaults(category)",
      )
      .or(
        `cup_product_id.eq.${productId},lid_product_id.eq.${productId},straw_product_id.eq.${productId},sleeve_product_id.eq.${productId}`,
      ),
    supabase.from("stock_snapshots").select("id", { count: "exact", head: true }).eq("product_id", productId),
    supabase
      .from("inventory_check_results")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("related_product_id", productId),
    supabase
      .from("raw_material_price_history")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId),
  ]);

  if (menuItemIngredientsResult.error) throw menuItemIngredientsResult.error;
  if (intermediateRecipeIngredientsResult.error) throw intermediateRecipeIngredientsResult.error;
  if (categoryDefaultVariantsResult.error) throw categoryDefaultVariantsResult.error;
  if (stockSnapshotsResult.error) throw stockSnapshotsResult.error;
  if (inventoryCheckResultsResult.error) throw inventoryCheckResultsResult.error;
  if (tasksResult.error) throw tasksResult.error;
  if (priceHistoryResult.error) throw priceHistoryResult.error;

  const menuItemRefs: ProductUsageRef[] = [];
  const seenMenuItems = new Set<string>();
  for (const row of (menuItemIngredientsResult.data ?? []) as unknown as {
    menu_item_id: string;
    menu_item: { id: string; name: string } | null;
  }[]) {
    if (row.menu_item && !seenMenuItems.has(row.menu_item.id)) {
      seenMenuItems.add(row.menu_item.id);
      menuItemRefs.push({ id: row.menu_item.id, name: row.menu_item.name });
    }
  }

  const recipeRefs: ProductUsageRef[] = [];
  const seenRecipes = new Set<string>();
  for (const row of (intermediateRecipeIngredientsResult.data ?? []) as unknown as {
    intermediate_recipe_id: string;
    intermediate_recipe: { id: string; name: string } | null;
  }[]) {
    if (row.intermediate_recipe && !seenRecipes.has(row.intermediate_recipe.id)) {
      seenRecipes.add(row.intermediate_recipe.id);
      recipeRefs.push({ id: row.intermediate_recipe.id, name: row.intermediate_recipe.name });
    }
  }

  const categoryDefaultRows = (categoryDefaultVariantsResult.data ?? []) as unknown as {
    id: string;
    hot_ice: string | null;
    size: string;
    category_default: { category: string } | null;
  }[];
  const categoryRefs: ProductUsageRef[] = categoryDefaultRows.map((row) => ({
    id: row.id,
    name: `${row.category_default?.category ?? "未設定カテゴリー"} / ${row.hot_ice ? `${row.hot_ice} ` : ""}${row.size}`,
  }));

  const usage: ProductUsage = {
    menuItemIngredients: { count: menuItemRefs.length, refs: menuItemRefs },
    intermediateRecipeIngredients: { count: recipeRefs.length, refs: recipeRefs },
    categoryDefaultVariants: { count: categoryRefs.length, refs: categoryRefs },
    stockSnapshots: stockSnapshotsResult.count ?? 0,
    inventoryCheckResults: inventoryCheckResultsResult.count ?? 0,
    tasks: tasksResult.count ?? 0,
    priceHistory: priceHistoryResult.count ?? 0,
    isUnused: false,
  };

  usage.isUnused =
    usage.menuItemIngredients.count === 0 &&
    usage.intermediateRecipeIngredients.count === 0 &&
    usage.categoryDefaultVariants.count === 0 &&
    usage.stockSnapshots === 0 &&
    usage.inventoryCheckResults === 0 &&
    usage.tasks === 0 &&
    usage.priceHistory === 0;

  return usage;
}
