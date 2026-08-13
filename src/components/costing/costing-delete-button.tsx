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

export function CostingDeleteButton({
  apiPath,
  redirectTo,
  itemLabel,
}: {
  apiPath: string;
  redirectTo?: string;
  itemLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(apiPath, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(`${itemLabel}を削除しました`);
      if (redirectTo) router.push(redirectTo);
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
          <DialogTitle>この{itemLabel}を削除しますか？</DialogTitle>
          <DialogDescription>
            一覧には表示されなくなります(他から参照されている場合は削除できません)。
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
