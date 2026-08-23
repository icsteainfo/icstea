"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { backOrPush } from "@/lib/navigation";

export function CostingVisibilityToggle({
  productId,
  showInCosting,
  redirectTo,
}: {
  productId: string;
  showInCosting: boolean;
  redirectTo: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function toggle() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/products/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [productId], show_in_costing: !showInCosting }),
      });
      if (!res.ok) throw new Error();
      if (showInCosting) {
        // 除外したので、開いた一覧(「原材料・資材」等)に戻る。
        toast.success("原価計算から外しました");
        backOrPush(router, redirectTo);
      } else {
        toast.success("原価計算の一覧に表示するようにしました");
        router.refresh();
      }
    } catch {
      toast.error("操作に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <p className="text-sm font-medium">「原材料・資材」一覧への表示</p>
        <p className="text-xs text-muted-foreground">
          {showInCosting
            ? "現在、原価計算の一覧に表示されています。"
            : "現在、原価計算の一覧から外れています(商品マスタ・在庫管理には残っています)。"}
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={toggle} disabled={submitting}>
        {showInCosting ? "原価計算から外す" : "原価計算に表示する"}
      </Button>
    </div>
  );
}
