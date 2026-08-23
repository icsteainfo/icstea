"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ProductUsage } from "@/lib/costing/types";
import { backOrPush } from "@/lib/navigation";

function usageSummaryLines(usage: ProductUsage): string[] {
  const lines: string[] = [];
  if (usage.menuItemIngredients.count > 0) lines.push(`ドリンクレシピ ${usage.menuItemIngredients.count}件`);
  if (usage.intermediateRecipeIngredients.count > 0)
    lines.push(`中間レシピ ${usage.intermediateRecipeIngredients.count}件`);
  if (usage.categoryDefaultVariants.count > 0)
    lines.push(`カテゴリー初期設定 ${usage.categoryDefaultVariants.count}件`);
  if (usage.stockSnapshots > 0) lines.push(`在庫データ ${usage.stockSnapshots}件`);
  if (usage.inventoryCheckResults > 0) lines.push(`棚卸し履歴 ${usage.inventoryCheckResults}件`);
  if (usage.tasks > 0) lines.push(`関連タスク ${usage.tasks}件`);
  if (usage.priceHistory > 0) lines.push(`仕入価格の履歴 ${usage.priceHistory}件`);
  return lines;
}

export function MergeProductButton({
  productId,
  productName,
  usage,
  candidates,
  redirectTo,
}: {
  productId: string;
  productName: string;
  usage: ProductUsage;
  candidates: { id: string; name: string }[];
  redirectTo: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [targetId, setTargetId] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);

  const filtered = candidates.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  const target = candidates.find((c) => c.id === targetId) ?? null;
  const usageLines = usageSummaryLines(usage);

  function reset() {
    setQuery("");
    setTargetId(null);
  }

  async function handleMerge() {
    if (!target) return;
    setMerging(true);
    try {
      const res = await fetch(`/api/products/${productId}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetProductId: target.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "統合に失敗しました");
      }
      toast.success(`「${productName}」を「${target.name}」に統合しました`);
      setOpen(false);
      backOrPush(router, redirectTo);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "統合に失敗しました");
    } finally {
      setMerging(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger render={<Button type="button" variant="outline" size="sm">重複商品と統合</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>「{productName}」を他の商品に統合</DialogTitle>
          <DialogDescription>
            残す商品(統合先)を選んでください。「{productName}」に紐づくデータは統合先へ引き継がれ、
            「{productName}」自体は一覧から表示されなくなります(物理削除はしません)。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {usageLines.length > 0 && (
            <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">引き継がれるデータ</p>
              <p>{usageLines.join(" / ")}</p>
            </div>
          )}

          <Input
            placeholder="統合先の商品名で検索"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setTargetId(null);
            }}
          />
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-1">
            {filtered.length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground">該当する商品がありません</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setTargetId(c.id)}
                  className={`block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted ${
                    targetId === c.id ? "bg-muted font-medium" : ""
                  }`}
                >
                  {c.name}
                </button>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleMerge} disabled={!target || merging}>
            {target ? `「${target.name}」に統合する` : "統合先を選んでください"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
