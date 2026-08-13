"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NewTaskMenuButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button>＋ タスク追加</Button>} />
      <DropdownMenuContent>
        <DropdownMenuItem render={<Link href="/tasks/new">通常のタスクを作成</Link>} />
        <DropdownMenuItem
          render={<Link href="/tasks/new-from-template">テンプレートから作成</Link>}
        />
        <DropdownMenuItem
          render={<Link href="/tasks/bulk-import">Todoをまとめて取り込む</Link>}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
