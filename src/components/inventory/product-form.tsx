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
import { Textarea } from "@/components/ui/textarea";
import { PRODUCT_CATEGORIES } from "@/lib/inventory/types";
import type { Product } from "@/lib/inventory/types";
import { unitCost } from "@/lib/costing/calculations";
import { MATERIAL_CATEGORIES } from "@/lib/costing/types";

export function ProductForm({
  mode,
  product,
}: {
  mode: "create" | "edit";
  product?: Product;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "茶葉");
  const [unit, setUnit] = useState(product?.unit ?? "g");
  const [leadTimeDays, setLeadTimeDays] = useState(
    String(product?.lead_time_days ?? 14),
  );
  const [safetyStock, setSafetyStock] = useState(
    String(product?.safety_stock ?? 0),
  );
  const [safetyStockDays, setSafetyStockDays] = useState(
    String(product?.safety_stock_days ?? 7),
  );
  const [supplier, setSupplier] = useState(product?.supplier ?? "");
  const [purchasePrice, setPurchasePrice] = useState(
    product?.purchase_price != null ? String(product.purchase_price) : "",
  );
  const [packageAmount, setPackageAmount] = useState(
    product?.package_amount != null ? String(product.package_amount) : "",
  );
  const [note, setNote] = useState(product?.note ?? "");
  const [materialCategory, setMaterialCategory] = useState<string | null>(
    product?.material_category ?? null,
  );

  const previewUnitCost = unitCost({
    purchase_price: purchasePrice === "" ? null : Number(purchasePrice),
    package_amount: packageAmount === "" ? null : Number(packageAmount),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name,
      category,
      unit,
      lead_time_days: Number(leadTimeDays),
      safety_stock: Number(safetyStock),
      safety_stock_days: Number(safetyStockDays),
      supplier: supplier.trim() === "" ? null : supplier.trim(),
      purchase_price: purchasePrice === "" ? null : Number(purchasePrice),
      package_amount: packageAmount === "" ? null : Number(packageAmount),
      note: note.trim() === "" ? null : note.trim(),
      material_category: materialCategory,
    };

    try {
      const res = await fetch(
        mode === "create" ? "/api/products" : `/api/products/${product!.id}`,
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

      toast.success(mode === "create" ? "商品を登録しました" : "更新しました");
      router.push("/products");
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
          required
        />
        <p className="text-xs text-muted-foreground">
          スプレッドシートの商品名と完全に一致させてください。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>カテゴリー(在庫管理用)</Label>
          <Select
            items={Object.fromEntries(PRODUCT_CATEGORIES.map((c) => [c, c]))}
            value={category}
            onValueChange={(v: string | null) => v && setCategory(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            在庫ページの絞り込みに使われる分類です。
          </p>
        </div>

        <div className="space-y-2">
          <Label>表示カテゴリー(原材料・資材一覧用)</Label>
          <Select
            items={Object.fromEntries([
              ["none", "未分類"],
              ...MATERIAL_CATEGORIES.map((c) => [c.name, `${c.emoji} ${c.name}`]),
            ])}
            value={materialCategory ?? "none"}
            onValueChange={(v: string | null) =>
              setMaterialCategory(!v || v === "none" ? null : v)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">未分類</SelectItem>
              {MATERIAL_CATEGORIES.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.emoji} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            「原材料・資材」一覧でのグループ分けに使います(在庫ページには影響しません)。
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="unit">単位</Label>
        <Input
          id="unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="g / 個 / 枚 など"
          required
        />
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">原価情報</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="supplier">仕入先</Label>
            <Input
              id="supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="任意"
            />
          </div>
          <div />
          <div className="space-y-2">
            <Label htmlFor="purchase_price">仕入価格(円)</Label>
            <Input
              id="purchase_price"
              type="number"
              min={0}
              step="0.01"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="例: 3500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="package_amount">
              内容量({unit || "単位"})
            </Label>
            <Input
              id="package_amount"
              type="number"
              min={0}
              step="0.01"
              value={packageAmount}
              onChange={(e) => setPackageAmount(e.target.value)}
              placeholder="例: 1000"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          仕入価格 ÷ 内容量 で、1{unit || "単位"}あたりの単価を自動計算します
          {previewUnitCost != null && (
            <>
              。現在の入力では
              <span className="font-medium text-foreground">
                {" "}
                ¥{previewUnitCost.toFixed(2)}/{unit || "単位"}
              </span>
              です。
            </>
          )}
          {previewUnitCost == null && "。"}
        </p>
        {product?.price_updated_at && (
          <p className="text-xs text-muted-foreground">
            最終価格更新日: {product.price_updated_at}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="note">メモ</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="任意"
            rows={2}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lead_time">発注〜納品までの日数(リードタイム)</Label>
          <Input
            id="lead_time"
            type="number"
            min={0}
            value={leadTimeDays}
            onChange={(e) => setLeadTimeDays(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="safety_stock_days">安全在庫の日数分</Label>
          <Input
            id="safety_stock_days"
            type="number"
            min={0}
            value={safetyStockDays}
            onChange={(e) => setSafetyStockDays(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            「1日あたりの使用量 × この日数」を安全在庫として自動計算します。
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="safety_stock">安全在庫の代わり値({unit})</Label>
        <Input
          id="safety_stock"
          type="number"
          min={0}
          value={safetyStock}
          onChange={(e) => setSafetyStock(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          使用量データがまだ足りない商品(記録が1回だけなど)では、自動計算の代わりにこちらの数値を使います。
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/products")}
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
