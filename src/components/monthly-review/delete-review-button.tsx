"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

export function DeleteReviewButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/monthly-reviews/${reviewId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("削除しました");
      router.push("/monthly-review");
      router.refresh();
    } catch {
      toast.error("削除に失敗しました");
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="destructive" size="sm">
            削除
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>このMTG記録を削除しますか?</DialogTitle>
          <DialogDescription>
            損益表の写真・MTGメモ・経営プランがすべて削除されます。この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            削除する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
