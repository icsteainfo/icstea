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

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("商品を削除しました");
      router.push("/products");
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
          <DialogTitle>この商品を削除しますか？</DialogTitle>
          <DialogDescription>
            過去の在庫記録は残りますが、一覧には表示されなくなります。
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
