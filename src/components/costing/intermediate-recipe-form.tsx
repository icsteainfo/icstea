"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product } from "@/lib/inventory/types";
import type { IntermediateRecipeWithIngredients } from "@/lib/costing/types";
import {
  intermediateRecipeUnitCost,
  sumIngredientCost,
  unitCost,
} from "@/lib/costing/calculations";

type IngredientRow = {
  key: string;
  product_id: string;
  amount: string;
  unit: string;
};

function makeKey() {
  return Math.random().toString(36).slice(2);
}

export function IntermediateRecipeForm({
  mode,
  recipe,
  products,
}: {
  mode: "create" | "edit";
  recipe?: IntermediateRecipeWithIngredients;
  products: Product[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState(recipe?.name ?? "");
  const [yieldAmount, setYieldAmount] = useState(
    recipe ? String(recipe.yield_amount) : "",
  );
  const [yieldUnit, setYieldUnit] = useState(recipe?.yield_unit ?? "g");
  const [note, setNote] = useState(recipe?.note ?? "");
  const [rows, setRows] = useState<IngredientRow[]>(
    recipe && recipe.ingredients.length > 0
      ? recipe.ingredients.map((ing) => ({
          key: makeKey(),
          product_id: ing.product_id,
          amount: String(ing.amount),
          unit: ing.unit,
        }))
      : [{ key: makeKey(), product_id: "", amount: "", unit: "g" }],
  );

  const productsById = new Map(products.map((p) => [p.id, p]));

  const lines = rows.map((row) => {
    const product = productsById.get(row.product_id);
    const amount = Number(row.amount);
    return {
      amount: Number.isFinite(amount) ? amount : 0,
      unitCost: product ? unitCost(product) : null,
    };
  });
  const hasIncompleteRow = rows.some((r) => !r.product_id || !r.amount);
  const totalCost = hasIncompleteRow ? null : sumIngredientCost(lines);
  const yieldNum = Number(yieldAmount);
  const previewUnitCost =
    !hasIncompleteRow && Number.isFinite(yieldNum) && yieldNum > 0
      ? intermediateRecipeUnitCost(totalCost, yieldNum)
      : null;

  function updateRow(key: string, patch: Partial<IngredientRow>) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { key: makeKey(), product_id: "", amount: "", unit: "g" },
    ]);
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const ingredients = rows
      .filter((r) => r.product_id && r.amount)
      .map((r) => ({
        product_id: r.product_id,
        amount: Number(r.amount),
        unit: r.unit,
      }));

    if (ingredients.length === 0) {
      toast.error("材料を1つ以上入力してください");
      return;
    }

    setSubmitting(true);
    const payload = {
      recipe: {
        name,
        yield_amount: Number(yieldAmount),
        yield_unit: yieldUnit,
        note: note.trim() === "" ? null : note.trim(),
      },
      ingredients,
    };

    try {
      const res = await fetch(
        mode === "create"
          ? "/api/costing/recipes"
          : `/api/costing/recipes/${recipe!.id}`,
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

      toast.success(mode === "create" ? "中間レシピを登録しました" : "更新しました");
      router.push("/costing/recipes");
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
        <Label htmlFor="name">レシピ名</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 白桃シロップ"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="yield_amount">出来上がり量</Label>
          <Input
            id="yield_amount"
            type="number"
            min={0}
            step="0.01"
            value={yieldAmount}
            onChange={(e) => setYieldAmount(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="yield_unit">単位</Label>
          <Input
            id="yield_unit"
            value={yieldUnit}
            onChange={(e) => setYieldUnit(e.target.value)}
            placeholder="g / ml"
            required
          />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">材料</h2>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            ＋ 材料を追加
          </Button>
        </div>

        {rows.map((row) => {
          const product = productsById.get(row.product_id);
          const cost = product ? unitCost(product) : null;
          return (
            <div key={row.key} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
              <Select
                items={Object.fromEntries(products.map((p) => [p.id, p.name]))}
                value={row.product_id || null}
                onValueChange={(v: string | null) => {
                  const p = v ? productsById.get(v) : undefined;
                  updateRow(row.key, {
                    product_id: v ?? "",
                    unit: p?.unit ?? row.unit,
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="材料を選択" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
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
                  {cost != null ? `¥${cost.toFixed(2)}/${product?.unit}` : "単価未設定"}
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
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
        <p>
          材料原価合計:{" "}
          {totalCost != null ? (
            <span className="font-semibold">¥{totalCost.toFixed(2)}</span>
          ) : (
            <span className="text-muted-foreground">未計算(材料・単価をすべて入力してください)</span>
          )}
        </p>
        <p>
          出来上がり1{yieldUnit}あたり原価:{" "}
          {previewUnitCost != null ? (
            <span className="font-semibold">¥{previewUnitCost.toFixed(2)}</span>
          ) : (
            <span className="text-muted-foreground">未計算</span>
          )}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">メモ</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="任意"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/costing/recipes")}
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
