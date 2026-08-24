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

const TODO_GROUP_ITEMS = [
  { href: "/tasks", label: "Todo一覧" },
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

      <div
        className={cn(
          "flex items-center gap-0.5 rounded-full",
          isTodoGroupActive && navLinkActiveClass,
        )}
      >
        <Link
          href="/tasks"
          className={cn(
            "flex items-center gap-1 rounded-l-full px-3 py-1.5 font-medium text-foreground/80 hover:bg-muted hover:text-foreground",
            isTodoGroupActive && "text-foreground font-semibold hover:bg-transparent",
          )}
        >
          <ListChecks className="size-4" />
          Todo
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Todoメニューを開く"
                className={cn(
                  "flex items-center rounded-r-full px-1.5 py-1.5 text-foreground/80 hover:bg-muted hover:text-foreground",
                  isTodoGroupActive && "text-foreground hover:bg-transparent",
                )}
              >
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
      </div>

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
