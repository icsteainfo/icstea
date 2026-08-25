"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SaveAsTemplateButton({
  taskId,
  taskTitle,
}: {
  taskId: string;
  taskTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(taskTitle);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("テンプレート名を入力してください");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/templates/from-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId, name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "テンプレートの作成に失敗しました");
      }
      toast.success("テンプレートを保存しました");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "テンプレートの作成に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setName(taskTitle);
      }}
    >
      <DialogTrigger
        render={<button type="button" className="text-muted-foreground hover:text-foreground hover:underline" />}
      >
        テンプレートにする
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>テンプレートとして保存</DialogTitle>
          <DialogDescription>
            大項目名・カテゴリー・サブタスクを引き継ぎます。期限・担当者・完了状態は引き継がれません(次回作成時に設定します)。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="template-name">テンプレート名</Label>
          <Input
            id="template-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
