"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  MaterialCategoryList,
  type MaterialCategoryGroup,
} from "@/components/costing/material-category-list";

export function MaterialsOrganizePanel({ groups }: { groups: MaterialCategoryGroup[] }) {
  const router = useRouter();
  const [organizing, setOrganizing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function stopOrganizing() {
    setOrganizing(false);
    setSelected(new Set());
  }

  async function handleHide() {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/products/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), show_in_costing: false }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${selected.size}件を原価計算から外しました`);
      stopOrganizing();
      router.refresh();
    } catch {
      toast.error("操作に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        {organizing ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selected.size}件選択中</span>
            <Button type="button" variant="outline" size="sm" onClick={stopOrganizing}>
              キャンセル
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleHide}
              disabled={submitting || selected.size === 0}
            >
              原価計算から外す
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => setOrganizing(true)}>
            整理する
          </Button>
        )}
      </div>
      <MaterialCategoryList
        groups={groups}
        organizing={organizing}
        selected={selected}
        onToggleSelect={toggleSelect}
      />
    </div>
  );
}
