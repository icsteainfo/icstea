"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { HeartMotif, StarMotif, SparkleMotif } from "@/components/home/motifs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function TaskCheckbox({
  taskId,
  completed,
  openSubtaskCount = 0,
}: {
  taskId: string;
  completed: boolean;
  openSubtaskCount?: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(completed);
  const [confirmCount, setConfirmCount] = useState<number | null>(null);
  const [forcing, setForcing] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  async function complete(force: boolean) {
    const res = await fetch(`/api/tasks/${taskId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true, force }),
    });

    if (res.status === 409) {
      const body = await res.json().catch(() => ({}));
      setConfirmCount(body.openCount ?? openSubtaskCount);
      return;
    }
    if (!res.ok) throw new Error();

    startTransition(() => router.refresh());
  }

  async function handleChange(next: boolean) {
    setChecked(next);
    if (next) setBurstKey((k) => k + 1);

    if (next && openSubtaskCount > 0) {
      setConfirmCount(openSubtaskCount);
      return;
    }

    try {
      if (next) {
        await complete(false);
      } else {
        const res = await fetch(`/api/tasks/${taskId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: false }),
        });
        if (!res.ok) throw new Error();
        startTransition(() => router.refresh());
      }
    } catch {
      setChecked(!next);
      toast.error("更新に失敗しました");
    }
  }

  async function handleForceComplete() {
    setForcing(true);
    try {
      await complete(true);
      setConfirmCount(null);
      setBurstKey((k) => k + 1);
    } catch {
      setChecked(false);
      toast.error("更新に失敗しました");
    } finally {
      setForcing(false);
    }
  }

  return (
    <>
      <span className="relative inline-flex">
        <Checkbox
          checked={checked}
          disabled={isPending}
          onCheckedChange={(value) => handleChange(value === true)}
          aria-label={completed ? "未完了に戻す" : "完了にする"}
        />
        {burstKey > 0 && (
          <span key={burstKey} aria-hidden className="pointer-events-none absolute inset-0">
            <HeartMotif className="pop-burst absolute -top-2 -left-2 size-3.5 text-brand-pink" />
            <StarMotif
              className="pop-burst absolute -top-3 left-1.5 size-3 text-[#F0B429]"
              style={{ animationDelay: "80ms" }}
            />
            <SparkleMotif
              className="pop-burst absolute -top-1 -right-2 size-3 text-[#A97EF0]"
              style={{ animationDelay: "140ms" }}
            />
          </span>
        )}
      </span>

      <Dialog
        open={confirmCount !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmCount(null);
            setChecked(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>未完了のサブタスクが{confirmCount}件あります</DialogTitle>
            <DialogDescription>
              それでもこの大項目を完了にしますか？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmCount(null);
                setChecked(false);
              }}
            >
              キャンセル
            </Button>
            <Button onClick={handleForceComplete} disabled={forcing}>
              完了にする
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
