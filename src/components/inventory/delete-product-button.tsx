"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  if (usage.menuItemIngredients.count > 0) lines.push(`ドリンクレシピ: ${usage.menuItemIngredients.count}件`);
  if (usage.intermediateRecipeIngredients.count > 0)
    lines.push(`中間レシピ: ${usage.intermediateRecipeIngredients.count}件`);
  if (usage.categoryDefaultVariants.count > 0)
    lines.push(`カテゴリー初期設定: ${usage.categoryDefaultVariants.count}件`);
  if (usage.stockSnapshots > 0) lines.push(`在庫データ: ${usage.stockSnapshots}件`);
  if (usage.inventoryCheckResults > 0) lines.push(`棚卸し履歴: ${usage.inventoryCheckResults}件`);
  if (usage.tasks > 0) lines.push(`関連タスク: ${usage.tasks}件`);
  if (usage.priceHistory > 0) lines.push(`仕入価格の履歴: ${usage.priceHistory}件`);
  return lines;
}

export function DeleteProductButton({
  productId,
  redirectTo = "/products",
  usage,
}: {
  productId: string;
  redirectTo?: string;
  usage?: ProductUsage;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const blocked = usage != null && !usage.isUnused;

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "削除に失敗しました");
      }
      toast.success("商品を削除しました");
      backOrPush(router, redirectTo);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="destructive" size="sm">
            削除
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>この商品を削除しますか?</DialogTitle>
          <DialogDescription>
            {blocked ? (
              <span className="space-y-1 block">
                <span className="block">
                  この商品は使用中のため削除できません。統合する場合は下の「統合」をご利用ください。
                </span>
                <span className="block">{usageSummaryLines(usage).join(" / ")}</span>
              </span>
            ) : (
              "過去の在庫記録は残りますが、一覧には表示されなくなります。"
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting || blocked}>
            削除する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
