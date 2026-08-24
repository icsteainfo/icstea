"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "記録なし";
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

function useLogEvent(productId: string, type: "ordered" | "received") {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLog() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/log-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error();
      toast.success(type === "ordered" ? "発注日を記録しました" : "入荷日を記録しました");
      router.refresh();
    } catch {
      toast.error("記録に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return { loading, handleLog };
}

export function MaterialOrderButton({
  productId,
  lastOrderedAt,
}: {
  productId: string;
  lastOrderedAt: string | null;
}) {
  const { loading, handleLog } = useLogEvent(productId, "ordered");
  return (
    <div className="flex flex-col items-start gap-0.5">
      <Button type="button" variant="outline" size="sm" disabled={loading} onClick={handleLog}>
        発注
      </Button>
      <span className="text-[10px] text-muted-foreground">{formatDate(lastOrderedAt)}</span>
    </div>
  );
}

export function MaterialReceiveButton({
  productId,
  lastReceivedAt,
}: {
  productId: string;
  lastReceivedAt: string | null;
}) {
  const { loading, handleLog } = useLogEvent(productId, "received");
  return (
    <div className="flex flex-col items-start gap-0.5">
      <Button type="button" variant="outline" size="sm" disabled={loading} onClick={handleLog}>
        入荷
      </Button>
      <span className="text-[10px] text-muted-foreground">{formatDate(lastReceivedAt)}</span>
    </div>
  );
}
