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
  { href: "/inventory", label: "在庫" },
  { href: "/costing", label: "ドリンク原価" },
  { href: "/sales", label: "売上分析" },
  { href: "/marketing", label: "マーケティング" },
];

const TODO_GROUP_ITEMS = [
  { href: "/tasks", label: "Todo一覧" },
  { href: "/staff", label: "スタッフ" },
  { href: "/categories", label: "カテゴリー" },
  { href: "/templates", label: "テンプレート" },
  { href: "/recurrence", label: "繰り返し" },
];

const navLinkClass =
  "rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground";
const navLinkActiveClass = "bg-tint-green text-foreground";

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
          "flex items-center gap-0.5 rounded-md",
          isTodoGroupActive && navLinkActiveClass,
        )}
      >
        <Link
          href="/tasks"
          className={cn(
            "flex items-center gap-1 rounded-l-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground",
            isTodoGroupActive && "text-foreground hover:bg-transparent",
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
                  "flex items-center rounded-r-md px-1.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground",
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
