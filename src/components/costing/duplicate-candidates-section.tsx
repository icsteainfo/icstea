"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export type DuplicateCandidateItem = {
  key: string;
  curated: { id: string; name: string; category: string | null; unitCostLabel: string | null };
  uncurated: { id: string; name: string };
};

export function DuplicateCandidatesSection({ items }: { items: DuplicateCandidateItem[] }) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border bg-muted/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm hover:bg-muted/30"
      >
        <span>
          🔎 重複候補({items.length}件) — 名前が似ていて、片方が未整理(カテゴリー・仕入価格未設定)の商品ペア
        </span>
        <span className="text-muted-foreground">{open ? "︿" : "﹀"}</span>
      </button>
      {open && (
        <div className="space-y-2 px-4 pb-4">
          <p className="text-xs text-muted-foreground">
            自動では統合しません。それぞれの商品ページで使用状況・在庫履歴・仕入情報を確認し、影響が少ない側を残す形で「重複商品と統合」をご利用ください。
          </p>
          {items.map((item) => (
            <div
              key={item.key}
              className="flex flex-wrap items-center gap-2 rounded-md border bg-background p-3 text-sm"
            >
              <Link href={`/products/${item.uncurated.id}?from=materials`} className="hover:underline">
                {item.uncurated.name}
              </Link>
              <span className="text-xs text-muted-foreground">(未整理)</span>
              <span className="text-muted-foreground">↔</span>
              <Link href={`/products/${item.curated.id}?from=materials`} className="hover:underline">
                {item.curated.name}
              </Link>
              <span className="text-xs text-muted-foreground">
                {item.curated.category ?? "未分類"}
                {item.curated.unitCostLabel ? ` ・ ${item.curated.unitCostLabel}` : ""}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                render={<Link href={`/products/${item.uncurated.id}?from=materials`}>確認する</Link>}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
