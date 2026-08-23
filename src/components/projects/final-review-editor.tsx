"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProjectAttachmentList } from "./project-attachment-list";
import { ProjectAttachmentUploader } from "./project-attachment-uploader";
import type { ProjectAttachment } from "@/lib/project-attachments/types";

export function FinalReviewEditor({
  projectId,
  finalReview,
  attachments,
}: {
  projectId: string;
  finalReview: string | null;
  attachments: ProjectAttachment[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(finalReview ?? "");
  const [saving, setSaving] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  const attachmentsSection = (
    <div className="space-y-2 border-t pt-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">添付ファイル</h3>
        <Button type="button" variant="ghost" size="xs" onClick={() => setShowUploader((v) => !v)}>
          {showUploader ? "閉じる" : "＋ 添付を追加"}
        </Button>
      </div>
      <ProjectAttachmentList attachments={attachments} />
      {showUploader && <ProjectAttachmentUploader projectId={projectId} />}
    </div>
  );

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ final_review: value || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("最終評価を保存しました");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="space-y-2 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">最終評価</h2>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            {finalReview ? "編集" : "記入する"}
          </Button>
        </div>
        {finalReview ? (
          <p className="whitespace-pre-wrap text-sm">{finalReview}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            プロジェクトが完了したら、振り返りをここに記録できます
          </p>
        )}
        {attachmentsSection}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">最終評価</h2>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={5}
        placeholder="うまくいった点・課題・次回への申し送りなど"
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setValue(finalReview ?? "");
            setEditing(false);
          }}
        >
          キャンセル
        </Button>
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          保存
        </Button>
      </div>
      {attachmentsSection}
    </div>
  );
}
