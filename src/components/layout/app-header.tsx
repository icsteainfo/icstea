import Link from "next/link";
import { Sparkles } from "lucide-react";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { AppNav } from "./app-nav";

export function AppHeader() {
  return (
    <header className="border-b bg-card/80 backdrop-blur-sm">
      <div
        aria-hidden
        className="h-1 w-full bg-[linear-gradient(90deg,var(--tint-pink-line),var(--tint-lavender-line),var(--tint-blue-line),var(--tint-yellow-line))]"
      />
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/home" className="flex items-center gap-1.5 font-semibold">
          <Sparkles className="size-4 text-primary" aria-hidden />
          icsTEA 経営アシスタント
        </Link>
        <AppNav />
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            ログアウト
          </Button>
        </form>
      </div>
    </header>
  );
}
