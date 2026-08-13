"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function LogEventButtons({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"ordered" | "received" | null>(null);

  async function handleLog(type: "ordered" | "received") {
    setLoading(type);
    try {
      const res = await fetch(`/api/products/${productId}/log-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        type === "ordered" ? "発注日を記録しました" : "入荷日を記録しました",
      );
      router.refresh();
    } catch {
      toast.error("記録に失敗しました");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading !== null}
        onClick={() => handleLog("ordered")}
      >
        今日発注した
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading !== null}
        onClick={() => handleLog("received")}
      >
        今日入荷した
      </Button>
    </div>
  );
}
