import { createClient } from "@/lib/supabase/server";
import { listProducts } from "@/lib/inventory/queries";
import { listIntermediateRecipes, listMenuItemsForCosting, loadCostingData } from "@/lib/costing/queries";
import { MenuItemForm } from "@/components/costing/menu-item-form";

export default async function NewMenuItemPage({
  searchParams,
}: {
  searchParams: Promise<{ parent?: string }>;
}) {
  const { parent } = await searchParams;
  const supabase = await createClient();
  const [products, intermediateRecipes, menuItems, data] = await Promise.all([
    listProducts(supabase),
    listIntermediateRecipes(supabase),
    listMenuItemsForCosting(supabase),
    loadCostingData(supabase),
  ]);

  const groupCandidates = menuItems.filter((m) => m.parent_menu_item_id === null);
  const parentItem = parent ? groupCandidates.find((m) => m.id === parent) : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-xl font-semibold">
        {parentItem ? `「${parentItem.name}」のバリエーションを追加` : "商品レシピを追加"}
      </h2>
      <MenuItemForm
        mode="create"
        products={products}
        intermediateRecipes={intermediateRecipes}
        intermediateRecipeUnitCostById={data.intermediateRecipeUnitCostById}
        groupCandidates={groupCandidates}
        initialParentId={parentItem?.id ?? null}
      />
    </div>
  );
}
