import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listProducts } from "@/lib/inventory/queries";
import {
  createStandardVariants,
  getMenuItemWithIngredients,
  getVariantsWithIngredients,
  listIntermediateRecipes,
  listMenuItemsForCosting,
  loadCostingData,
} from "@/lib/costing/queries";
import { MenuItemForm } from "@/components/costing/menu-item-form";
import { CostingDeleteButton } from "@/components/costing/costing-delete-button";
import { MenuGroupDetail, type VariantGroup } from "@/components/costing/menu-group-detail";
import type { VariantEditData } from "@/components/costing/variant-recipe-editor";

// ご要望の並び順: ICEのS/M/L → HOTのS/M/L
const HOT_ICE_ORDER: { key: "ICE" | "HOT" | "none"; label: string }[] = [
  { key: "ICE", label: "ICE" },
  { key: "HOT", label: "HOT" },
  { key: "none", label: "HOT/ICE指定なし" },
];
const SIZE_ORDER: Record<string, number> = { S: 0, M: 1, L: 2 };

export default async function EditMenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [menuItem, products, intermediateRecipes, menuItems, data] = await Promise.all([
    getMenuItemWithIngredients(supabase, id),
    listProducts(supabase),
    listIntermediateRecipes(supabase),
    listMenuItemsForCosting(supabase),
    loadCostingData(supabase),
  ]);

  if (!menuItem) notFound();

  // 親商品(トップレベル)は、バリエーションがまだ0件でも常に一覧・追加ボタンを表示する。
  // バリエーションの原価入力は、このページの中にまとめて表示する
  // (「商品」と「バリエーション」を分け、1画面でICE S/M/L→HOT S/M/Lの原価を編集できる構造)。
  if (menuItem.parent_menu_item_id === null) {
    let variants = await getVariantsWithIngredients(supabase, id);

    // バリエーションが1件もない商品を開いた時は、基本形の6種類をその場で自動作成する
    // (「＋一括作成」ボタンを押さなくても、開いた時点で最初から6個並んでいる状態にするため)。
    if (variants.length === 0) {
      await createStandardVariants(supabase, id, menuItem.name);
      variants = await getVariantsWithIngredients(supabase, id);
    }

    const variantsByHotIce: VariantGroup[] = HOT_ICE_ORDER.map(({ key, label }) => {
      const groupVariants: VariantEditData[] = variants
        .filter((v) => (key === "none" ? v.hot_ice === null : v.hot_ice === key))
        .sort(
          (a, b) =>
            (SIZE_ORDER[a.size ?? ""] ?? 99) - (SIZE_ORDER[b.size ?? ""] ?? 99) ||
            a.sort_order - b.sort_order,
        )
        .map((v) => ({
          id: v.id,
          heading: `${v.size ?? "サイズ指定なし"}${v.variant_label ? `(${v.variant_label})` : ""}`,
          hotIce: v.hot_ice,
          size: v.size,
          listPrice: v.list_price,
          ingredients: v.ingredients.map((ing) => ({
            ingredient_type: ing.ingredient_type,
            product_id: ing.product_id,
            intermediate_recipe_id: ing.intermediate_recipe_id,
            amount: ing.amount,
            unit: ing.unit,
          })),
        }));
      return { label, variants: groupVariants };
    }).filter((group) => group.variants.length > 0);

    return (
      <div className="mx-auto max-w-2xl">
        <MenuGroupDetail
          groupId={menuItem.id}
          groupName={menuItem.name}
          groupRecipeCategory={menuItem.recipe_category}
          variantsByHotIce={variantsByHotIce}
          products={products}
          intermediateRecipes={intermediateRecipes}
          intermediateRecipeUnitCostById={data.intermediateRecipeUnitCostById}
        />
      </div>
    );
  }

  const groupCandidates = menuItems.filter(
    (m) => m.parent_menu_item_id === null && m.id !== id,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">商品レシピを編集</h2>
        <CostingDeleteButton
          apiPath={`/api/costing/menu-items/${id}`}
          redirectTo="/costing/menu"
          itemLabel="商品レシピ"
        />
      </div>
      {menuItem.parent && (
        <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          「{menuItem.parent.name}」のバリエーションです。
        </p>
      )}
      <MenuItemForm
        mode="edit"
        menuItem={menuItem}
        products={products}
        intermediateRecipes={intermediateRecipes}
        intermediateRecipeUnitCostById={data.intermediateRecipeUnitCostById}
        groupCandidates={groupCandidates}
      />
    </div>
  );
}
