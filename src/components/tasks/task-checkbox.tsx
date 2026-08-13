"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
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
    } catch {
      setChecked(false);
      toast.error("更新に失敗しました");
    } finally {
      setForcing(false);
    }
  }

  return (
    <>
      <Checkbox
        checked={checked}
        disabled={isPending}
        onCheckedChange={(value) => handleChange(value === true)}
        aria-label={completed ? "未完了に戻す" : "完了にする"}
      />

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
