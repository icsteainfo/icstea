"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CreateReorderTaskButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/create-task`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      await res.json();
      toast.success("「発注する」タスクを作成しました");
      router.push("/home");
      router.refresh();
    } catch {
      toast.error("タスクの作成に失敗しました");
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={loading} onClick={handleClick}>
      「発注する」タスクを作成
    </Button>
  );
}
