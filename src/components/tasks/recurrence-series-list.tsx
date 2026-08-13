"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatRecurrenceRuleWithDueOffset } from "@/lib/tasks/recurrence-format";
import type { RecurrenceSeriesWithRelations } from "@/lib/tasks/types";

export function RecurrenceSeriesList({
  series,
}: {
  series: RecurrenceSeriesWithRelations[];
}) {
  const router = useRouter();
  const [stoppingId, setStoppingId] = useState<string | null>(null);

  async function handleStop(id: string) {
    try {
      const res = await fetch(`/api/recurrence-series/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("繰り返しを停止しました");
      router.refresh();
    } catch {
      toast.error("停止に失敗しました");
    } finally {
      setStoppingId(null);
    }
  }

  if (series.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        登録されている繰り返しタスクはありません
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {series.map((s) => (
        <div
          key={s.id}
          className="flex items-start justify-between gap-3 rounded-lg border bg-background p-3"
        >
          <div className="space-y-1">
            <p className="font-medium">{s.title_template}</p>
            <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
              <Badge variant="outline">
                {formatRecurrenceRuleWithDueOffset(
                  s.recurrence_type,
                  s.recurrence_config,
                  s.due_offset_days,
                )}
              </Badge>
              {s.category_name && <Badge variant="secondary">{s.category_name}</Badge>}
              <Badge variant="outline">担当: {s.assignee_name}</Badge>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/recurrence/${s.id}/edit`} />}
            >
              編集
            </Button>
            <Dialog
              open={stoppingId === s.id}
              onOpenChange={(open) => setStoppingId(open ? s.id : null)}
            >
              <DialogTrigger
                render={
                  <Button size="sm" variant="destructive">
                    停止
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>「{s.title_template}」の繰り返しを停止しますか？</DialogTitle>
                  <DialogDescription>
                    今後、新しいタスクは自動生成されなくなります。すでに作成済みのタスクは残ります。
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setStoppingId(null)}>
                    キャンセル
                  </Button>
                  <Button variant="destructive" onClick={() => handleStop(s.id)}>
                    停止する
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      ))}
    </div>
  );
}
