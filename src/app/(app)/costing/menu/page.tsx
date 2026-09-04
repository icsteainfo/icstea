import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computeMenuItemCost, loadCostingData } from "@/lib/costing/queries";
import { costRatio } from "@/lib/costing/calculations";
import { Button } from "@/components/ui/button";
import {
  MenuCategoryList,
  type MenuCategoryGroup,
  type MenuCategoryItem,
} from "@/components/costing/menu-category-list";
import { OTHER_RECIPE_CATEGORY, RECIPE_CATEGORIES } from "@/lib/costing/types";
import { IdolBadge } from "@/components/idol/idol-image";
import type { MenuItem } from "@/lib/sales/types";

export default async function MenuRecipesPage() {
  const supabase = await createClient();
  const data = await loadCostingData(supabase);

  const childCountByParent = new Map<string, number>();
  for (const item of data.menuItems) {
    if (item.parent_menu_item_id) {
      childCountByParent.set(
        item.parent_menu_item_id,
        (childCountByParent.get(item.parent_menu_item_id) ?? 0) + 1,
      );
    }
  }

  // バリエーションを持つ商品は、一覧では親商品を1つだけ表示する
  // (原価率はバリエーションごとに違うため、詳細画面で確認してもらう)。
  function toItem(item: MenuItem): MenuCategoryItem {
    const variantCount = childCountByParent.get(item.id) ?? 0;
    if (variantCount > 0) {
      return { id: item.id, name: item.name, ratio: null, variantCount };
    }
    const cost = computeMenuItemCost(item.id, data);
    return { id: item.id, name: item.name, ratio: costRatio(cost, item.list_price) };
  }

  function sortAndConvert(items: MenuItem[]): MenuCategoryItem[] {
    return items
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
      .map(toItem);
  }

  const topLevelItems = data.menuItems.filter((item) => item.parent_menu_item_id === null);

  const itemsByCategory = new Map<string, MenuItem[]>();
  for (const item of topLevelItems) {
    const key = item.recipe_category ?? "";
    const list = itemsByCategory.get(key) ?? [];
    list.push(item);
    itemsByCategory.set(key, list);
  }

  const knownNames = new Set(RECIPE_CATEGORIES.map((c) => c.name));
  const groups: MenuCategoryGroup[] = RECIPE_CATEGORIES.map((c) => ({
    name: c.name,
    emoji: c.emoji,
    items: sortAndConvert(itemsByCategory.get(c.name) ?? []),
  }));

  const otherItems = topLevelItems.filter(
    (item) => !knownNames.has(item.recipe_category ?? ""),
  );
  if (otherItems.length > 0) {
    groups.push({
      name: OTHER_RECIPE_CATEGORY.name,
      emoji: OTHER_RECIPE_CATEGORY.emoji,
      items: sortAndConvert(otherItems),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IdolBadge imageKey="cost" />
          <p className="text-sm text-muted-foreground">
            カテゴリーごとにグループ化して表示しています。商品名をタップすると編集画面に移動、グリップ(⠿)をドラッグすると並び替えできます。原価率が出せない商品には⚠️がつきます。
          </p>
        </div>
        <Button render={<Link href="/costing/menu/new">＋ 商品レシピを追加</Link>} />
      </div>

      <MenuCategoryList groups={groups} />
    </div>
  );
}
