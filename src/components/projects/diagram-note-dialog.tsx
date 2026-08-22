"use client";

import { useRef, useState } from "react";
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
import { DiagramEditor, type DiagramEditorHandle } from "./diagram/diagram-editor";

export function DiagramNoteDialog({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<DiagramEditorHandle>(null);

  async function handleSave() {
    const diagram = editorRef.current?.getDiagram();
    if (!diagram || diagram.nodes.length === 0) {
      toast.error("ノードを1つ以上追加してください");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_type: "diagram", content: title || null, diagram }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "保存に失敗しました");
      }
      toast.success("関連図を追加しました");
      setOpen(false);
      setTitle("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        関連図を作成
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>関連図を作成</DialogTitle>
          <DialogDescription>
            要因やできごとをノードとして追加し、矢印でつないで関係を整理できます。保存後は新しい経過感想として1件追加され、後から編集はできません(修正する場合は削除して作り直してください)。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="diagram-title">タイトル(任意)</Label>
          <Input
            id="diagram-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 客足が伸びない原因の整理"
          />
        </div>

        <DiagramEditor ref={editorRef} />

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
