"use client";

import { useState } from "react";
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
import type { MenuItem } from "@/lib/sales/types";
import type {
  IngredientType,
  IntermediateRecipe,
  MenuItemWithIngredients,
} from "@/lib/costing/types";
import { RECIPE_CATEGORIES } from "@/lib/costing/types";
import { costRatio, sumIngredientCost, unitCost } from "@/lib/costing/calculations";

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

export function MenuItemForm({
  mode,
  menuItem,
  products,
  intermediateRecipes,
  intermediateRecipeUnitCostById,
  groupCandidates,
  initialParentId,
}: {
  mode: "create" | "edit";
  menuItem?: MenuItemWithIngredients;
  products: Product[];
  intermediateRecipes: IntermediateRecipe[];
  intermediateRecipeUnitCostById: Map<string, number | null>;
  groupCandidates: MenuItem[];
  initialParentId?: string | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState(menuItem?.name ?? "");
  const [category, setCategory] = useState(menuItem?.category ?? "");
  const [recipeCategory, setRecipeCategory] = useState<string | null>(
    menuItem?.recipe_category ?? null,
  );
  const [parentId, setParentId] = useState<string | null>(
    menuItem?.parent_menu_item_id ?? initialParentId ?? null,
  );
  const [hotIce, setHotIce] = useState<string | null>(menuItem?.hot_ice ?? null);
  const [size, setSize] = useState(menuItem?.size ?? "");
  const [variantLabel, setVariantLabel] = useState(menuItem?.variant_label ?? "");
  const [listPrice, setListPrice] = useState(
    menuItem?.list_price != null ? String(menuItem.list_price) : "",
  );

  const [rows, setRows] = useState<IngredientRow[]>(
    menuItem && menuItem.ingredients.length > 0
      ? menuItem.ingredients.map((ing) => ({
          key: makeKey(),
          ingredient_type: ing.ingredient_type,
          ref_id: (ing.product_id ?? ing.intermediate_recipe_id) as string,
          amount: String(ing.amount),
          unit: ing.unit,
        }))
      : [
          {
            key: makeKey(),
            ingredient_type: "raw_material",
            ref_id: "",
            amount: "",
            unit: "g",
          },
        ],
  );

  const productsById = new Map(products.map((p) => [p.id, p]));
  const recipesById = new Map(intermediateRecipes.map((r) => [r.id, r]));

  function rowUnitCost(row: IngredientRow): number | null {
    if (!row.ref_id) return null;
    if (row.ingredient_type === "raw_material") {
      const p = productsById.get(row.ref_id);
      return p ? unitCost(p) : null;
    }
    return intermediateRecipeUnitCostById.get(row.ref_id) ?? null;
  }

  // カップ・蓋・スリーブ・ストローなど「容器」カテゴリーの原材料かどうか。
  // それ以外(茶葉・ミルク・中間レシピなど)はすべて「中身」として扱う。
  function isContainerRow(row: IngredientRow): boolean {
    if (row.ingredient_type !== "raw_material") return false;
    return productsById.get(row.ref_id)?.material_category === "カップ・蓋・ストロー";
  }

  const hasIncompleteRow = rows.some((r) => !r.ref_id || !r.amount);
  const toLine = (row: IngredientRow) => ({
    amount: Number(row.amount) || 0,
    unitCost: rowUnitCost(row),
  });
  const containerRows = rows.filter(isContainerRow);
  const contentsRows = rows.filter((r) => !isContainerRow(r));
  const containerCost = hasIncompleteRow ? null : sumIngredientCost(containerRows.map(toLine));
  const contentsCost = hasIncompleteRow ? null : sumIngredientCost(contentsRows.map(toLine));
  const totalCost = hasIncompleteRow ? null : sumIngredientCost(rows.map(toLine));
  const price = listPrice === "" ? null : Number(listPrice);
  const ratio = costRatio(totalCost, price);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const ingredients = rows
      .filter((r) => r.ref_id && r.amount)
      .map((r) => ({
        ingredient_type: r.ingredient_type,
        product_id: r.ingredient_type === "raw_material" ? r.ref_id : null,
        intermediate_recipe_id: r.ingredient_type === "intermediate_recipe" ? r.ref_id : null,
        amount: Number(r.amount),
        unit: r.unit,
      }));

    setSubmitting(true);
    const payload = {
      menuItem: {
        name,
        category: category.trim() === "" ? null : category.trim(),
        parent_menu_item_id: parentId,
        hot_ice: hotIce === "none" ? null : hotIce,
        size: size.trim() === "" ? null : size.trim(),
        variant_label: variantLabel.trim() === "" ? null : variantLabel.trim(),
        list_price: listPrice === "" ? null : Number(listPrice),
        recipe_category: recipeCategory,
      },
      ingredients,
    };

    try {
      const res = await fetch(
        mode === "create"
          ? "/api/costing/menu-items"
          : `/api/costing/menu-items/${menuItem!.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "保存に失敗しました");
      }

      toast.success(mode === "create" ? "商品レシピを登録しました" : "更新しました");
      router.push(parentId ? `/costing/menu/${parentId}` : "/costing/menu");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">商品名</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: サバラガムワ ロイヤルミルクティー ICE M"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>カテゴリー(売上分析用)</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="例: ミルクティー"
          />
          <p className="text-xs text-muted-foreground">
            売上分析の「カテゴリー別売上」で使われる分類です。POSの取込データが自動で設定することもあります。
          </p>
        </div>
        <div className="space-y-2">
          <Label>表示カテゴリー(商品レシピ一覧用)</Label>
          <Select
            items={Object.fromEntries([
              ["none", "未設定"],
              ...RECIPE_CATEGORIES.map((c) => [c.name, `${c.emoji} ${c.name}`]),
            ])}
            value={recipeCategory ?? "none"}
            onValueChange={(v: string | null) =>
              setRecipeCategory(!v || v === "none" ? null : v)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">未設定</SelectItem>
              {RECIPE_CATEGORIES.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.emoji} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            「商品レシピ」一覧画面でのグループ分けに使います(売上分析には影響しません)。
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>商品グループ(親商品)</Label>
          <Select
            items={Object.fromEntries([
              ["none", "なし(単独の商品)"],
              ...groupCandidates
                .filter((g) => g.id !== menuItem?.id)
                .map((g) => [g.id, g.name]),
            ])}
            value={parentId ?? "none"}
            onValueChange={(v: string | null) =>
              setParentId(!v || v === "none" ? null : v)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">なし(単独の商品)</SelectItem>
              {groupCandidates
                .filter((g) => g.id !== menuItem?.id)
                .map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            「ロイヤルミルクティー」のように複数バリエーションをまとめたい場合、先に親となる商品を作ってから選んでください。
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>HOT/ICE</Label>
          <Select
            items={{ none: "指定なし", HOT: "HOT", ICE: "ICE" }}
            value={hotIce ?? "none"}
            onValueChange={(v: string | null) => setHotIce(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">指定なし</SelectItem>
              <SelectItem value="HOT">HOT</SelectItem>
              <SelectItem value="ICE">ICE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>サイズ</Label>
          <Select
            items={{ none: "指定なし", S: "S", M: "M", L: "L" }}
            value={size || "none"}
            onValueChange={(v: string | null) => setSize(!v || v === "none" ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">指定なし</SelectItem>
              <SelectItem value="S">S</SelectItem>
              <SelectItem value="M">M</SelectItem>
              <SelectItem value="L">L</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            1バリエーションにつき1サイズです。S/M/Lごとに材料量が違う場合は、それぞれ別のバリエーションとして登録してください。
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="variant_label">バリエーション名</Label>
          <Input
            id="variant_label"
            value={variantLabel}
            onChange={(e) => setVariantLabel(e.target.value)}
            placeholder="例: 豆乳変更"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="list_price">販売価格(円)</Label>
        <Input
          id="list_price"
          type="number"
          min={0}
          value={listPrice}
          onChange={(e) => setListPrice(e.target.value)}
          placeholder="例: 800"
        />
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">レシピ(材料)</h2>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            ＋ 材料を追加
          </Button>
        </div>

        {rows.map((row) => {
          const cost = rowUnitCost(row);
          const unitLabel =
            row.ingredient_type === "raw_material"
              ? productsById.get(row.ref_id)?.unit
              : recipesById.get(row.ref_id)?.yield_unit;
          return (
            <div
              key={row.key}
              className="grid gap-2 sm:grid-cols-[auto_2fr_1fr_1fr_auto]"
            >
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
                items={Object.fromEntries(
                  (row.ingredient_type === "raw_material" ? products : intermediateRecipes).map(
                    (item) => [item.id, item.name],
                  ),
                )}
                value={row.ref_id || null}
                onValueChange={(v: string | null) => {
                  const unitFromRef =
                    row.ingredient_type === "raw_material"
                      ? productsById.get(v ?? "")?.unit
                      : recipesById.get(v ?? "")?.yield_unit;
                  updateRow(row.key, {
                    ref_id: v ?? "",
                    unit: unitFromRef ?? row.unit,
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="材料を選択" />
                </SelectTrigger>
                <SelectContent>
                  {(row.ingredient_type === "raw_material" ? products : intermediateRecipes).map(
                    (item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ),
                  )}
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
                <span
                  className={`whitespace-nowrap rounded px-1.5 py-0.5 text-xs ${
                    isContainerRow(row)
                      ? "bg-tint-blue text-foreground"
                      : "bg-tint-green text-foreground"
                  }`}
                >
                  {isContainerRow(row) ? "🥤 容器" : "🍵 中身"}
                </span>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {cost != null ? `¥${cost.toFixed(2)}/${unitLabel}` : "単価未設定"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(row.key)}
                >
                  削除
                </Button>
              </div>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground">
          🥤 容器 = カップ・蓋・スリーブ・ストローなど(原材料・資材の「カップ・蓋・ストロー」カテゴリーで自動判定しています)。それ以外は 🍵 中身 として扱います。
        </p>
      </div>

      <div className="space-y-1 rounded-lg border bg-muted/30 p-4 text-sm">
        <p className="flex justify-between">
          <span>🥤 容器原価</span>
          <span className="font-semibold">
            {containerCost != null ? `¥${containerCost.toFixed(2)}` : "—"}
          </span>
        </p>
        <p className="flex justify-between">
          <span>＋ 🍵 中身原価</span>
          <span className="font-semibold">
            {contentsCost != null ? `¥${contentsCost.toFixed(2)}` : "—"}
          </span>
        </p>
        <p className="flex justify-between border-t pt-1">
          <span>＝ 総原価</span>
          {totalCost != null ? (
            <span className="font-semibold">¥{totalCost.toFixed(2)}</span>
          ) : (
            <span className="text-muted-foreground">未計算(材料・単価をすべて入力してください)</span>
          )}
        </p>
        <p className="flex justify-between">
          <span>原価率</span>
          {ratio != null ? (
            <span className="font-semibold">{ratio.toFixed(1)}%</span>
          ) : (
            <span className="text-muted-foreground">販売価格を入力すると表示されます</span>
          )}
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(parentId ? `/costing/menu/${parentId}` : "/costing/menu")}
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={submitting}>
          {mode === "create" ? "登録" : "更新"}
        </Button>
      </div>
    </form>
  );
}
