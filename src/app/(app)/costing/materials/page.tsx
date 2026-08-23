import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listProducts } from "@/lib/inventory/queries";
import { Button } from "@/components/ui/button";
import { type MaterialCategoryGroup } from "@/components/costing/material-category-list";
import { MaterialsOrganizePanel } from "@/components/costing/materials-organize-panel";
import { HiddenMaterialsSection } from "@/components/costing/hidden-materials-section";
import { DuplicateCandidatesSection } from "@/components/costing/duplicate-candidates-section";
import { MATERIAL_CATEGORIES, OTHER_MATERIAL_CATEGORY } from "@/lib/costing/types";
import { unitCost } from "@/lib/costing/calculations";
import { findDuplicateCandidates } from "@/lib/inventory/duplicate-candidates";
import type { Product } from "@/lib/inventory/types";

export default async function CostingMaterialsPage() {
  const supabase = await createClient();
  const allProducts = await listProducts(supabase);
  const products = allProducts.filter((p) => p.show_in_costing);
  const hiddenProducts = allProducts.filter((p) => !p.show_in_costing);

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
      .map((p) => ({
        id: p.id,
        name: p.name,
        hasCost: unitCost(p) != null,
        supplier: p.supplier,
        unit: p.unit,
        purchasePrice: p.purchase_price,
        packageAmount: p.package_amount,
        unitCost: unitCost(p),
        lastOrderedAt: p.last_ordered_at,
        lastReceivedAt: p.last_received_at,
      }));

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

  const duplicateCandidates = findDuplicateCandidates(allProducts.filter((p) => p.is_active)).map(
    (pair) => ({
      key: pair.key,
      curated: {
        id: pair.curated.id,
        name: pair.curated.name,
        category: pair.curated.material_category,
        unitCostLabel: (() => {
          const cost = unitCost(pair.curated);
          return cost != null ? `¥${cost.toFixed(2)}/${pair.curated.unit}` : null;
        })(),
      },
      uncurated: { id: pair.uncurated.id, name: pair.uncurated.name },
    }),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          カテゴリーごとにグループ化して表示しています。商品名をタップすると仕入価格などの詳細・編集画面に移動します(「在庫」の商品マスタと共通です)。「整理する」で複数選択し、原価計算に使わない商品をまとめて非表示にできます。
        </p>
        <Button variant="outline" render={<Link href="/products/new">＋ 原材料を追加</Link>} />
      </div>

      <DuplicateCandidatesSection items={duplicateCandidates} />

      <MaterialsOrganizePanel groups={groups} />

      <HiddenMaterialsSection
        items={hiddenProducts
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
