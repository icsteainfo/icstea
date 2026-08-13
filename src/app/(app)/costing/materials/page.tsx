import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listProducts } from "@/lib/inventory/queries";
import { Button } from "@/components/ui/button";
import {
  MaterialCategoryList,
  type MaterialCategoryGroup,
} from "@/components/costing/material-category-list";
import { MATERIAL_CATEGORIES, OTHER_MATERIAL_CATEGORY } from "@/lib/costing/types";
import { unitCost } from "@/lib/costing/calculations";
import type { Product } from "@/lib/inventory/types";

export default async function CostingMaterialsPage() {
  const supabase = await createClient();
  const products = await listProducts(supabase);

  const itemsByCategory = new Map<string, Product[]>();
  for (const product of products) {
    const key = product.material_category ?? "";
    const list = itemsByCategory.get(key) ?? [];
    list.push(product);
    itemsByCategory.set(key, list);
  }

  const sortItems = (list: Product[]) =>
    list
      .slice()
      .sort(
        (a, b) =>
          a.material_sort_order - b.material_sort_order || a.name.localeCompare(b.name),
      )
      .map((p) => ({ id: p.id, name: p.name, hasCost: unitCost(p) != null }));

  const knownNames = new Set(MATERIAL_CATEGORIES.map((c) => c.name));
  const groups: MaterialCategoryGroup[] = MATERIAL_CATEGORIES.map((c) => ({
    name: c.name,
    emoji: c.emoji,
    items: sortItems(itemsByCategory.get(c.name) ?? []),
  }));

  const otherItems = products.filter(
    (p) => !knownNames.has(p.material_category ?? ""),
  );
  if (otherItems.length > 0) {
    groups.push({
      name: OTHER_MATERIAL_CATEGORY.name,
      emoji: OTHER_MATERIAL_CATEGORY.emoji,
      items: sortItems(otherItems),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          カテゴリーごとにグループ化して表示しています。材料名をタップすると仕入価格などの詳細・編集画面に移動します(「在庫」の商品マスタと共通です)。
        </p>
        <Button variant="outline" render={<Link href="/products/new">＋ 原材料を追加</Link>} />
      </div>

      <MaterialCategoryList groups={groups} />
    </div>
  );
}
