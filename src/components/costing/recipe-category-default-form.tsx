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
import type { RecipeCategoryDefaultVariant } from "@/lib/costing/types";

const CONTAINER_MATERIAL_CATEGORY = "カップ・蓋・ストロー";

type RoleKey = "cup" | "lid" | "straw" | "sleeve";
const ROLES: { key: RoleKey; label: string; keyword: string }[] = [
  { key: "cup", label: "カップ", keyword: "カップ" },
  { key: "lid", label: "蓋", keyword: "蓋" },
  { key: "straw", label: "ストロー", keyword: "ストロー" },
  { key: "sleeve", label: "スリーブ", keyword: "スリーブ" },
];

type SlotRow = {
  key: string;
  hot_ice: "HOT" | "ICE" | "none";
  size: string;
  list_price: string;
  cup_product_id: string;
  lid_product_id: string;
  straw_product_id: string;
  sleeve_product_id: string;
};

function roleField(role: RoleKey): "cup_product_id" | "lid_product_id" | "straw_product_id" | "sleeve_product_id" {
  switch (role) {
    case "cup":
      return "cup_product_id";
    case "lid":
      return "lid_product_id";
    case "straw":
      return "straw_product_id";
    case "sleeve":
      return "sleeve_product_id";
  }
}

function makeKey() {
  return Math.random().toString(36).slice(2);
}

function emptyRow(): SlotRow {
  return {
    key: makeKey(),
    hot_ice: "none",
    size: "M",
    list_price: "",
    cup_product_id: "",
    lid_product_id: "",
    straw_product_id: "",
    sleeve_product_id: "",
  };
}

function toSlotRow(v: RecipeCategoryDefaultVariant): SlotRow {
  return {
    key: makeKey(),
    hot_ice: v.hot_ice ?? "none",
    size: v.size,
    list_price: v.list_price != null ? String(v.list_price) : "",
    cup_product_id: v.cup_product_id ?? "",
    lid_product_id: v.lid_product_id ?? "",
    straw_product_id: v.straw_product_id ?? "",
    sleeve_product_id: v.sleeve_product_id ?? "",
  };
}

export function RecipeCategoryDefaultForm({
  category,
  initialVariants,
  products,
}: {
  category: string;
  initialVariants: RecipeCategoryDefaultVariant[];
  products: Product[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<SlotRow[]>(
    initialVariants.length > 0 ? initialVariants.map(toSlotRow) : [emptyRow()],
  );
  const [saving, setSaving] = useState(false);

  function updateRow(key: string, patch: Partial<SlotRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }
  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  function candidatesFor(keyword: string): Product[] {
    return products.filter(
      (p) => p.material_category === CONTAINER_MATERIAL_CATEGORY && p.name.includes(keyword),
    );
  }

  async function handleSave() {
    if (rows.some((r) => !r.size.trim())) {
      toast.error("サイズを入力してください");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/costing/recipe-category-defaults/${encodeURIComponent(category)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variants: rows.map((r) => ({
            hot_ice: r.hot_ice === "none" ? null : r.hot_ice,
            size: r.size.trim(),
            list_price: r.list_price === "" ? null : Number(r.list_price),
            cup_product_id: r.cup_product_id || null,
            lid_product_id: r.lid_product_id || null,
            straw_product_id: r.straw_product_id || null,
            sleeve_product_id: r.sleeve_product_id || null,
          })),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("初期設定を保存しました");
      router.refresh();
    } catch {
      toast.error("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-2">
                <Label>HOT/ICE</Label>
                <Select
                  items={{ none: "指定なし", HOT: "HOT", ICE: "ICE" }}
                  value={row.hot_ice}
                  onValueChange={(v: string | null) =>
                    updateRow(row.key, { hot_ice: (v as SlotRow["hot_ice"]) ?? "none" })
                  }
                >
                  <SelectTrigger className="w-32">
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
                <Input
                  className="w-24"
                  value={row.size}
                  onChange={(e) => updateRow(row.key, { size: e.target.value })}
                  placeholder="例: M"
                />
              </div>
              <div className="space-y-2">
                <Label>販売価格</Label>
                <div className="flex items-center gap-1">
                  <Input
                    className="w-28"
                    type="number"
                    min={0}
                    value={row.list_price}
                    onChange={(e) => updateRow(row.key, { list_price: e.target.value })}
                    placeholder="例: 550"
                  />
                  <span className="text-sm text-muted-foreground">円</span>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(row.key)}>
                この組み合わせを削除
              </Button>
            </div>
            <div className="flex flex-wrap gap-4">
              {ROLES.map(({ key, label, keyword }) => {
                const candidates = candidatesFor(keyword);
                const field = roleField(key);
                const value = row[field] || "none";
                return (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <Select
                      items={{
                        none: "なし",
                        ...Object.fromEntries(candidates.map((p) => [p.id, p.name])),
                      }}
                      value={value}
                      onValueChange={(v: string | null) =>
                        updateRow(row.key, { [field]: !v || v === "none" ? "" : v })
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">なし</SelectItem>
                        {candidates.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          ＋ サイズ/HOT・ICEの組み合わせを追加
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving}>
          保存
        </Button>
      </div>
    </div>
  );
}
