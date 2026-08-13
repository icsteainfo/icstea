"use client";

import { useState } from "react";
import Link from "next/link";
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
import type { IntermediateRecipe } from "@/lib/costing/types";
import { RECIPE_CATEGORIES } from "@/lib/costing/types";
import { CostingDeleteButton } from "@/components/costing/costing-delete-button";
import { VariantRecipeEditor, type VariantEditData } from "@/components/costing/variant-recipe-editor";

export type VariantGroup = {
  label: string;
  variants: VariantEditData[];
};

export function MenuGroupDetail({
  groupId,
  groupName,
  groupRecipeCategory,
  variantsByHotIce,
  products,
  intermediateRecipes,
  intermediateRecipeUnitCostById,
}: {
  groupId: string;
  groupName: string;
  groupRecipeCategory: string | null;
  variantsByHotIce: VariantGroup[];
  products: Product[];
  intermediateRecipes: IntermediateRecipe[];
  intermediateRecipeUnitCostById: Map<string, number | null>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(groupName);
  const [recipeCategory, setRecipeCategory] = useState<string | null>(groupRecipeCategory);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/costing/menu-items/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuItem: { name, recipe_category: recipeCategory },
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("更新しました");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {editing ? (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="space-y-2">
            <Label htmlFor="group_name">商品名</Label>
            <Input id="group_name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>表示カテゴリー</Label>
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
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              キャンセル
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              保存
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{groupName}</h2>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
              商品名・カテゴリーを編集
            </Button>
            <CostingDeleteButton
              apiPath={`/api/costing/menu-items/${groupId}`}
              redirectTo="/costing/menu"
              itemLabel="商品"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          render={<Link href={`/costing/menu/new?parent=${groupId}`}>＋ バリエーションを追加</Link>}
        />
      </div>

      {variantsByHotIce.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          バリエーションを準備できませんでした。「＋ バリエーションを追加」からやり直してください。
        </p>
      ) : (
        <div className="space-y-5">
          {variantsByHotIce.map((group) => (
            <div key={group.label} className="space-y-3">
              <p className="px-1 text-sm font-semibold text-muted-foreground">{group.label}</p>
              <div className="space-y-3">
                {group.variants.map((variant) => (
                  <VariantRecipeEditor
                    key={variant.id}
                    variant={variant}
                    products={products}
                    intermediateRecipes={intermediateRecipes}
                    intermediateRecipeUnitCostById={intermediateRecipeUnitCostById}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
