"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type HiddenMaterialItem = { id: string; name: string };

export function HiddenMaterialsSection({ items }: { items: HiddenMaterialItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  if (items.length === 0) return null;

  async function restore(id: string) {
    setRestoringId(id);
    try {
      const res = await fetch("/api/products/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], show_in_costing: true }),
      });
      if (!res.ok) throw new Error();
      toast.success("原価計算の一覧に再表示しました");
      router.refresh();
    } catch {
      toast.error("操作に失敗しました");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div className="rounded-lg border bg-muted/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm text-muted-foreground hover:bg-muted/30"
      >
        <span>🗂 原価計算から外した商品({items.length}件)</span>
        <span>{open ? "︿" : "﹀"}</span>
      </button>
      {open && (
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-full border bg-background py-1 pl-3 pr-1 text-sm"
            >
              <span>{item.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => restore(item.id)}
                disabled={restoringId === item.id}
              >
                再表示
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
