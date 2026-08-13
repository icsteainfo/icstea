"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product } from "@/lib/inventory/types";
import type { IngredientType, IntermediateRecipe } from "@/lib/costing/types";
import { costRatio, grossProfit, sumIngredientCost, unitCost } from "@/lib/costing/calculations";
import { CostingDeleteButton } from "@/components/costing/costing-delete-button";

const CONTAINER_MATERIAL_CATEGORY = "カップ・蓋・ストロー";

type IngredientRow = {
  key: string;
  ingredient_type: IngredientType;
  ref_id: string;
  amount: string;
  unit: string;
};

function makeKey() {
  return Math.random().toString(36).slice(2);
}

export type VariantEditData = {
  id: string;
  heading: string;
  hotIce: "HOT" | "ICE" | null;
  size: string | null;
  listPrice: number | null;
  ingredients: {
    ingredient_type: IngredientType;
    product_id: string | null;
    intermediate_recipe_id: string | null;
    amount: number;
    unit: string;
  }[];
};

function byMaterialSortOrder(a: Product, b: Product) {
  return a.material_sort_order - b.material_sort_order;
}

// カップ・蓋・スリーブ・ストローは、原材料・資材ページの名称(例:「アイスカップS」「ホット蓋ML」)に
// その語句が含まれるかどうかで候補を絞り込む。並び順も同じマスタの並び順(material_sort_order)に揃える。
function findContainerCandidates(products: Product[], keyword: string): Product[] {
  return products
    .filter((p) => p.material_category === CONTAINER_MATERIAL_CATEGORY && p.name.includes(keyword))
    .sort(byMaterialSortOrder);
}

// 仕入価格・内容量が未入力で原価計算できない資材は、選ぶ前に気づけるよう⚠マークを付ける。
// 絵文字だけだと見落としやすいため、色付きの文字でも強調する。
function materialLabel(p: Product): ReactNode {
  if (unitCost(p) != null) return p.name;
  return (
    <span className="flex items-center gap-1">
      <span className="font-semibold text-destructive">⚠ 原価未設定</span>
      <span>{p.name}</span>
    </span>
  );
}

function MaterialSelectField({
  label,
  candidates,
  value,
  onChange,
  width = "w-44",
  noneFirst = true,
}: {
  label: string;
  candidates: Product[];
  value: string;
  onChange: (v: string | null) => void;
  width?: string;
  noneFirst?: boolean;
}) {
  const noneItem = <SelectItem value="none">なし</SelectItem>;
  const candidateItems = candidates.map((p) => (
    <SelectItem key={p.id} value={p.id}>
      {materialLabel(p)}
    </SelectItem>
  ));
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        items={{
          ...(noneFirst ? { none: "なし" } : {}),
          ...Object.fromEntries(candidates.map((p) => [p.id, materialLabel(p)])),
          ...(noneFirst ? {} : { none: "なし" }),
        }}
        value={value}
        onValueChange={onChange}
      >
        <SelectTrigger className={width}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {noneFirst ? (
            <>
              {noneItem}
              {candidateItems}
            </>
          ) : (
            <>
              {candidateItems}
              {noneItem}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export function VariantRecipeEditor({
  variant,
  products,
  intermediateRecipes,
  intermediateRecipeUnitCostById,
}: {
  variant: VariantEditData;
  products: Product[];
  intermediateRecipes: IntermediateRecipe[];
  intermediateRecipeUnitCostById: Map<string, number | null>;
}) {
  const router = useRouter();
  const [listPrice, setListPrice] = useState(
    variant.listPrice != null ? String(variant.listPrice) : "",
  );
  const [rows, setRows] = useState<IngredientRow[]>(
    variant.ingredients.length > 0
      ? variant.ingredients.map((ing) => ({
          key: makeKey(),
          ingredient_type: ing.ingredient_type,
          ref_id: (ing.product_id ?? ing.intermediate_recipe_id) as string,
          amount: String(ing.amount),
          unit: ing.unit,
        }))
      : [{ key: makeKey(), ingredient_type: "raw_material", ref_id: "", amount: "", unit: "g" }],
  );
  const [saving, setSaving] = useState(false);

  const productsById = new Map(products.map((p) => [p.id, p]));
  const recipesById = new Map(intermediateRecipes.map((r) => [r.id, r]));

  // 「原材料」欄には、容器(カップ・蓋・スリーブ・ストロー)は表示しない。
  // それらは上の「容器」欄のプルダウンだけで選ぶ。
  const contentProducts = products.filter((p) => p.material_category !== CONTAINER_MATERIAL_CATEGORY);

  function rowUnitCost(row: IngredientRow): number | null {
    if (!row.ref_id) return null;
    if (row.ingredient_type === "raw_material") {
      const p = productsById.get(row.ref_id);
      return p ? unitCost(p) : null;
    }
    return intermediateRecipeUnitCostById.get(row.ref_id) ?? null;
  }

  function isContainerRow(row: IngredientRow): boolean {
    if (row.ingredient_type !== "raw_material") return false;
    return productsById.get(row.ref_id)?.material_category === CONTAINER_MATERIAL_CATEGORY;
  }

  // カップ・蓋・スリーブ・ストロー共通のクイック選択。
  // 選ぶと`rows`に材料として追加され、選び直すと入れ替わり、「なし」にすると削除される。
  function quickSelect(candidates: Product[]) {
    const candidateIds = new Set(candidates.map((p) => p.id));
    const currentRow = rows.find(
      (r) => r.ingredient_type === "raw_material" && candidateIds.has(r.ref_id),
    );
    function onChange(productId: string | null) {
      const withoutRow = rows.filter((r) => r.key !== currentRow?.key);
      if (!productId || productId === "none") {
        setRows(withoutRow);
        return;
      }
      const product = candidates.find((p) => p.id === productId);
      if (!product) return;
      setRows([
        ...withoutRow,
        {
          key: currentRow?.key ?? makeKey(),
          ingredient_type: "raw_material",
          ref_id: product.id,
          amount: currentRow?.amount || "1",
          unit: product.unit,
        },
      ]);
    }
    return { currentRow, onChange };
  }

  const cupCandidates = findContainerCandidates(products, "カップ");
  const cupSelect = quickSelect(cupCandidates);

  const lidCandidates = findContainerCandidates(products, "蓋");
  const lidSelect = quickSelect(lidCandidates);

  const sleeveCandidates = findContainerCandidates(products, "スリーブ");
  const sleeveSelect = quickSelect(sleeveCandidates);

  const strawCandidates = findContainerCandidates(products, "ストロー");
  const strawSelect = quickSelect(strawCandidates);

  const hasIncompleteRow = rows.some((r) => !r.ref_id || !r.amount);
  const toLine = (row: IngredientRow) => ({
    amount: Number(row.amount) || 0,
    unitCost: rowUnitCost(row),
  });
  const containerCost = hasIncompleteRow
    ? null
    : sumIngredientCost(rows.filter(isContainerRow).map(toLine));
  const materialCost = hasIncompleteRow
    ? null
    : sumIngredientCost(rows.filter((r) => !isContainerRow(r)).map(toLine));
  const totalCost = hasIncompleteRow ? null : sumIngredientCost(rows.map(toLine));
  const price = listPrice === "" ? null : Number(listPrice);
  const ratio = costRatio(totalCost, price);
  const profit = grossProfit(price, totalCost);
  const profitRatio = costRatio(profit, price);

  function updateRow(key: string, patch: Partial<IngredientRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { key: makeKey(), ingredient_type: "raw_material", ref_id: "", amount: "", unit: "g" },
    ]);
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  async function handleSave() {
    const ingredients = rows
      .filter((r) => r.ref_id && r.amount)
      .map((r) => ({
        ingredient_type: r.ingredient_type,
        product_id: r.ingredient_type === "raw_material" ? r.ref_id : null,
        intermediate_recipe_id: r.ingredient_type === "intermediate_recipe" ? r.ref_id : null,
        amount: Number(r.amount),
        unit: r.unit,
      }));

    setSaving(true);
    try {
      const res = await fetch(`/api/costing/menu-items/${variant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuItem: { list_price: listPrice === "" ? null : Number(listPrice) },
          ingredients,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${variant.heading}を保存しました`);
      router.refresh();
    } catch {
      toast.error("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  const materialRows = rows.filter((row) => !isContainerRow(row));

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{variant.heading}</h3>
        <CostingDeleteButton
          apiPath={`/api/costing/menu-items/${variant.id}`}
          itemLabel="バリエーション"
        />
      </div>

      {/* 1. 販売価格 */}
      <div className="space-y-2">
        <Label htmlFor={`price-${variant.id}`}>販売価格</Label>
        <div className="flex items-center gap-2">
          <Input
            id={`price-${variant.id}`}
            type="number"
            min={0}
            value={listPrice}
            onChange={(e) => setListPrice(e.target.value)}
            placeholder="例: 550"
            className="max-w-32"
          />
          <span className="text-sm text-muted-foreground">円</span>
        </div>
      </div>

      {/* 2. 容器 */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">🥤 容器</p>
        <div className="flex flex-wrap gap-4">
          <MaterialSelectField
            label="カップ"
            candidates={cupCandidates}
            value={cupSelect.currentRow?.ref_id ?? "none"}
            onChange={cupSelect.onChange}
          />
          <MaterialSelectField
            label="蓋"
            candidates={lidCandidates}
            value={lidSelect.currentRow?.ref_id ?? "none"}
            onChange={lidSelect.onChange}
          />
          <MaterialSelectField
            label="スリーブ"
            candidates={sleeveCandidates}
            value={sleeveSelect.currentRow?.ref_id ?? "none"}
            onChange={sleeveSelect.onChange}
            width="w-32"
            noneFirst={false}
          />
          <MaterialSelectField
            label="ストロー"
            candidates={strawCandidates}
            value={strawSelect.currentRow?.ref_id ?? "none"}
            onChange={strawSelect.onChange}
          />
        </div>
      </div>

      {/* 3. 原材料 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">🍵 原材料</p>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            ＋ 材料を追加
          </Button>
        </div>

        {materialRows.map((row) => {
          const cost = rowUnitCost(row);
          const unitLabel =
            row.ingredient_type === "raw_material"
              ? productsById.get(row.ref_id)?.unit
              : recipesById.get(row.ref_id)?.yield_unit;
          const itemOptions = row.ingredient_type === "raw_material" ? contentProducts : intermediateRecipes;
          const itemLabel = (item: Product | IntermediateRecipe) =>
            row.ingredient_type === "raw_material" ? materialLabel(item as Product) : item.name;
          return (
            <div key={row.key} className="grid gap-2 sm:grid-cols-[auto_2fr_1fr_1fr_auto]">
              <Select
                items={{ raw_material: "原材料", intermediate_recipe: "中間レシピ" }}
                value={row.ingredient_type}
                onValueChange={(v: string | null) =>
                  updateRow(row.key, {
                    ingredient_type: (v as IngredientType) ?? "raw_material",
                    ref_id: "",
                  })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="raw_material">原材料</SelectItem>
                  <SelectItem value="intermediate_recipe">中間レシピ</SelectItem>
                </SelectContent>
              </Select>

              <Select
                items={Object.fromEntries(itemOptions.map((item) => [item.id, itemLabel(item)]))}
                value={row.ref_id || null}
                onValueChange={(v: string | null) => {
                  const unitFromRef =
                    row.ingredient_type === "raw_material"
                      ? productsById.get(v ?? "")?.unit
                      : recipesById.get(v ?? "")?.yield_unit;
                  updateRow(row.key, { ref_id: v ?? "", unit: unitFromRef ?? row.unit });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="材料を選択" />
                </SelectTrigger>
                <SelectContent>
                  {itemOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {itemLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                min={0}
                step="0.01"
                value={row.amount}
                onChange={(e) => updateRow(row.key, { amount: e.target.value })}
                placeholder="使用量"
              />
              <Input
                value={row.unit}
                onChange={(e) => updateRow(row.key, { unit: e.target.value })}
                placeholder="単位"
              />
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {cost != null ? `¥${cost.toFixed(2)}/${unitLabel}` : "単価未設定"}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(row.key)}>
                  削除
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. 原価 */}
      <div className="space-y-1 rounded-lg bg-muted/30 p-3 text-sm">
        <p className="flex justify-between">
          <span>🥤 容器原価</span>
          <span>{containerCost != null ? `¥${containerCost.toFixed(2)}` : "—"}</span>
        </p>
        <p className="flex justify-between">
          <span>🍵 原材料原価</span>
          <span>{materialCost != null ? `¥${materialCost.toFixed(2)}` : "—"}</span>
        </p>
        <p className="flex justify-between border-t pt-1 font-semibold">
          <span>合計原価</span>
          <span>{totalCost != null ? `¥${totalCost.toFixed(2)}` : "未計算"}</span>
        </p>
        <p className="flex justify-between font-semibold">
          <span>原価率</span>
          <span>{ratio != null ? `${ratio.toFixed(1)}%` : "—"}</span>
        </p>
        <p className="flex justify-between border-t pt-1 font-semibold">
          <span>粗利</span>
          <span>{profit != null ? `¥${profit.toFixed(2)}` : "—"}</span>
        </p>
        <p className="flex justify-between font-semibold">
          <span>粗利率</span>
          <span>{profitRatio != null ? `${profitRatio.toFixed(1)}%` : "—"}</span>
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          {variant.heading}を保存
        </Button>
      </div>
    </div>
  );
}
