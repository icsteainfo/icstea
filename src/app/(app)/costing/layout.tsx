"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/costing/menu", label: "商品レシピ" },
  { href: "/costing/analysis", label: "原価分析" },
  { href: "/costing/materials", label: "原材料・資材" },
  { href: "/costing/recipes", label: "中間レシピ" },
  { href: "/costing/recipe-categories", label: "カテゴリー初期設定" },
];

export default function CostingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">ドリンク原価</h1>
        <p className="text-sm text-muted-foreground">
          ドリンクメニューの原材料・レシピ・原価率を管理します。
        </p>
      </div>
      <nav className="flex flex-wrap gap-1 border-b pb-2 text-sm">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "rounded-md px-3 py-1.5",
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
