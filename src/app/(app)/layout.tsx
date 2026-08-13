import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
