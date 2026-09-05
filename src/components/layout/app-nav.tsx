"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const MAIN_ITEMS = [
  { href: "/home", label: "ホーム" },
  { href: "/costing", label: "ドリンク原価" },
  { href: "/sales", label: "売上分析" },
  { href: "/marketing", label: "マーケティング" },
  { href: "/monthly-review", label: "経営MTG" },
];

const navLinkClass =
  "rounded-full px-3 py-1.5 font-medium text-foreground/80 hover:bg-muted hover:text-foreground";
const navLinkActiveClass = "bg-secondary text-foreground font-semibold hover:bg-secondary";

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm">
      {MAIN_ITEMS.map((item) => (
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
