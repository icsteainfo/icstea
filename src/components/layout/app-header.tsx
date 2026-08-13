import Link from "next/link";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { AppNav } from "./app-nav";

export function AppHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/home" className="font-semibold">
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
