"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SyncInventoryButton({
  size = "default",
  label = "スプレッドシートから在庫を取り込む",
}: {
  size?: "default" | "sm";
  label?: string;
}) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/inventory/sync", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "取り込みに失敗しました");
      }
      const data = await res.json();
      const restockNote =
        data.restocksDetected > 0 ? `、入荷を自動検知${data.restocksDetected}件` : "";
      toast.success(
        `在庫を取り込みました(${data.snapshotsRecorded}件、新規商品${data.productsAdded}件${restockNote})`,
      );

      if (data.checkError) {
        toast.error(`在庫チェック(◎/×)の取り込みに失敗しました: ${data.checkError}`);
      } else if (data.check) {
        const resolvedNote =
          data.check.tasksResolved > 0 ? `、解消${data.check.tasksResolved}件` : "";
        toast.success(
          `在庫チェック: ×判定${data.check.processed}件(新規Todo${data.check.tasksCreated}件、更新${data.check.tasksUpdated}件${resolvedNote})`,
        );
      }
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "取り込みに失敗しました",
      );
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Button type="button" size={size} onClick={handleSync} disabled={syncing}>
      {syncing ? "取り込み中..." : label}
    </Button>
  );
}
