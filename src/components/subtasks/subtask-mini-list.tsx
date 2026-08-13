"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { SubtaskWithRelations } from "@/lib/subtasks/types";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

// ホーム画面などで、大項目の下にサブタスクを折りたたんで表示するための簡易一覧
export function SubtaskMiniList({ subtasks }: { subtasks: SubtaskWithRelations[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (subtasks.length === 0) return null;

  async function handleToggle(subtaskId: string, completed: boolean) {
    try {
      const res = await fetch(`/api/subtasks/${subtaskId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("更新に失敗しました");
    }
  }

  return (
    <div className="mt-2 pl-9">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:underline"
      >
        {open ? (
          <ChevronDownIcon className="size-3" />
        ) : (
          <ChevronRightIcon className="size-3" />
        )}
        サブタスクを{open ? "隠す" : "表示"}
      </button>
      {open && (
        <div className="mt-1.5 space-y-1.5 border-l-2 pl-3">
          {subtasks.map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={s.status === "completed"}
                onCheckedChange={(v) => handleToggle(s.id, v === true)}
                aria-label={s.status === "completed" ? "未完了に戻す" : "完了にする"}
              />
              <span
                className={
                  s.status === "completed"
                    ? "text-muted-foreground line-through"
                    : ""
                }
              >
                {s.title}
              </span>
              {s.due_date && (
                <Badge variant="outline">期限: {formatDate(s.due_date)}</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
