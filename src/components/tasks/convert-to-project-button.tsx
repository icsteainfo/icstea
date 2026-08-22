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

export function ConvertToProjectButton({
  taskId,
  taskTitle,
  subtaskCount,
  attachmentCount,
}: {
  taskId: string;
  taskTitle: string;
  subtaskCount: number;
  attachmentCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(taskTitle);
  const [converting, setConverting] = useState(false);

  async function handleConvert() {
    if (!name.trim()) {
      toast.error("プロジェクト名を入力してください");
      return;
    }
    setConverting(true);
    try {
      const res = await fetch("/api/projects/from-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId, name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "プロジェクトへの変換に失敗しました");
      }
      const body = await res.json();
      toast.success("プロジェクトに変換しました");
      setOpen(false);
      router.push(`/projects/${body.project.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "プロジェクトへの変換に失敗しました");
    } finally {
      setConverting(false);
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
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        プロジェクトに変換
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>プロジェクトに変換</DialogTitle>
          <DialogDescription>
            このTodoをプロジェクトに変換します。
            {subtaskCount > 0
              ? `サブタスク${subtaskCount}件は、それぞれプロジェクトに紐づく独立したTodoとして引き継がれます。`
              : "サブタスクはありません。空のプロジェクトが作成されます。"}
            カテゴリー・開始日・期限・完了状態は可能な範囲で引き継ぎますが、優先度・対応待ち設定は引き継がれません。
            {attachmentCount > 0 &&
              ` 添付ファイル${attachmentCount}件は引き継げないため削除されます。`}
            元のTodoはこの操作で削除されます。この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="project-name">プロジェクト名</Label>
          <Input
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleConvert} disabled={converting}>
            {converting ? "変換中..." : "変換する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
