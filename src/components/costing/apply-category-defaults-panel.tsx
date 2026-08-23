"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { ApplyPreviewItem } from "@/lib/costing/category-defaults-queries";

function slotLabel(slot: ApplyPreviewItem["slots"][number]): string {
  return `${slot.hot_ice ? `${slot.hot_ice} ` : ""}${slot.size}`;
}

export function ApplyCategoryDefaultsPanel({
  category,
  preview,
}: {
  category: string;
  preview: ApplyPreviewItem[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(preview.filter((item) => item.slots.some((s) => s.action !== "skip")).map((item) => item.menuItemId)),
  );
  const [applying, setApplying] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleApply() {
    if (selected.size === 0) {
      toast.error("反映する商品を選択してください");
      return;
    }
    setApplying(true);
    try {
      const res = await fetch(
        `/api/costing/recipe-category-defaults/${encodeURIComponent(category)}/apply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ menuItemIds: Array.from(selected) }),
        },
      );
      if (!res.ok) throw new Error();
      const body = await res.json();
      toast.success(`反映しました(新規${body.created}件・補完${body.updated}件)`);
      router.push("/costing/menu");
      router.refresh();
    } catch {
      toast.error("反映に失敗しました");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {preview.map((item) => {
          const hasChanges = item.slots.some((s) => s.action !== "skip");
          return (
            <div key={item.menuItemId} className="space-y-2 rounded-lg border p-4">
              <label className="flex items-center gap-2 font-medium">
                <Checkbox
                  checked={selected.has(item.menuItemId)}
                  onCheckedChange={() => toggle(item.menuItemId)}
                  disabled={!hasChanges}
                />
                {item.menuItemName}
                {!hasChanges && (
                  <Badge variant="outline" className="ml-1">
                    変更なし
                  </Badge>
                )}
              </label>
              <div className="flex flex-wrap gap-2 pl-6">
                {item.slots.map((slot, index) => (
                  <div
                    key={`${slot.hot_ice ?? "none"}-${slot.size}-${index}`}
                    className="rounded-md border bg-muted/30 px-2 py-1 text-xs"
                  >
                    <span className="font-medium">{slotLabel(slot)}</span>
                    {slot.action === "skip" ? (
                      <span className="ml-1 text-muted-foreground">変更なし(設定済み)</span>
                    ) : slot.action === "create" ? (
                      <span className="ml-1 font-medium">
                        新規作成: {slot.fills.filter((f) => f !== "新規バリエーション").join("・") || "容器なし"}
                      </span>
                    ) : (
                      <span className="ml-1">空欄を補完: {slot.fills.join("・")}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={handleApply} disabled={applying}>
          選択した商品に反映する
        </Button>
      </div>
    </div>
  );
}
