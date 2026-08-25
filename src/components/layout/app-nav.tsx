"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ListChecks } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const MAIN_ITEMS = [
  { href: "/home", label: "ホーム" },
  { href: "/projects", label: "プロジェクト" },
  { href: "/costing", label: "ドリンク原価" },
  { href: "/sales", label: "売上分析" },
  { href: "/marketing", label: "マーケティング" },
  { href: "/monthly-review", label: "経営MTG" },
];

// Todoの表示・操作自体はホーム画面に一本化したため、ここには
// Todoに関する設定・管理系のページだけを残す(「Todo一覧」ページは廃止)
const TODO_GROUP_ITEMS = [
  { href: "/staff", label: "スタッフ" },
  { href: "/categories", label: "カテゴリー" },
  { href: "/templates", label: "テンプレート" },
  { href: "/recurrence", label: "繰り返し" },
];

const navLinkClass =
  "rounded-full px-3 py-1.5 font-medium text-foreground/80 hover:bg-muted hover:text-foreground";
const navLinkActiveClass = "bg-secondary text-foreground font-semibold hover:bg-secondary";

export function AppNav() {
  const pathname = usePathname();
  const isTodoGroupActive = TODO_GROUP_ITEMS.some((item) => pathname.startsWith(item.href));

  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm">
      {MAIN_ITEMS.slice(0, 1).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(navLinkClass, pathname.startsWith(item.href) && navLinkActiveClass)}
        >
          {item.label}
        </Link>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Todo設定メニューを開く"
              className={cn(navLinkClass, "flex items-center gap-1", isTodoGroupActive && navLinkActiveClass)}
            >
              <ListChecks className="size-4" />
              Todo設定
              <ChevronDown className="size-3.5" />
            </button>
          }
        />
        <DropdownMenuContent className="rounded-xl" sideOffset={6}>
          {TODO_GROUP_ITEMS.map((item) => (
            <DropdownMenuItem key={item.href} render={<Link href={item.href}>{item.label}</Link>} />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {MAIN_ITEMS.slice(1).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(navLinkClass, pathname.startsWith(item.href) && navLinkActiveClass)}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
