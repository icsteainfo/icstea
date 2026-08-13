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

export function DeleteTemplateButton({ templateId }: { templateId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/templates/${templateId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("テンプレートを削除しました");
      router.push("/templates");
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
            テンプレートを削除
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>テンプレートを削除しますか？</DialogTitle>
          <DialogDescription>
            この操作は取り消せません。作成済みのタスクには影響しません。
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
