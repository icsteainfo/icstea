"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TaskProgress } from "@/lib/subtasks/types";

export function ProgressEditor({
  taskId,
  progress,
}: {
  taskId: string;
  progress: TaskProgress | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(progress?.percent ?? 0));
  const [saving, setSaving] = useState(false);

  if (!progress) return null;

  async function save(nextValue: number | null) {
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: nextValue }),
      });
      if (!res.ok) throw new Error();
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1.5 rounded-lg border p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          進捗: {progress.completed}/{progress.total}完了({progress.percent}%)
          {progress.isOverride && (
            <span className="ml-1 text-xs font-normal text-muted-foreground">(手動)</span>
          )}
        </span>
        {!editing && (
          <div className="flex items-center gap-2">
            {progress.isOverride && (
              <button
                type="button"
                onClick={() => save(null)}
                disabled={saving}
                className="text-xs text-muted-foreground hover:underline"
              >
                自動に戻す
              </button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setValue(String(progress.percent));
                setEditing(true);
              }}
            >
              <PencilIcon className="size-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
        />
      </div>
      {editing && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">%</span>
          <Button
            type="button"
            size="sm"
            disabled={saving}
            onClick={() => save(Math.min(100, Math.max(0, Number(value) || 0)))}
          >
            保存
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
            キャンセル
          </Button>
        </div>
      )}
    </div>
  );
}
