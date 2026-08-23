"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { PROJECT_ATTACHMENTS_BUCKET } from "@/lib/project-attachments/queries";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function ProjectAttachmentUploader({
  projectId,
  noteId = null,
}: {
  projectId: string;
  noteId?: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [urlLabel, setUrlLabel] = useState("");
  const [addingUrl, setAddingUrl] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("ファイルサイズは20MBまでです");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const extMatch = /\.[a-zA-Z0-9]+$/.exec(file.name);
      const ext = extMatch ? extMatch[0] : "";
      const storagePath = `${projectId}/${noteId ?? "review"}/${crypto.randomUUID()}${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(PROJECT_ATTACHMENTS_BUCKET)
        .upload(storagePath, file);
      if (uploadError) {
        console.error("storage upload error:", uploadError);
        throw new Error(`アップロードに失敗しました: ${uploadError.message}`);
      }

      const res = await fetch("/api/project-attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "file",
          project_id: projectId,
          note_id: noteId,
          storage_path: storagePath,
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("attachment save error:", body);
        throw new Error(`添付情報の保存に失敗しました: ${body.error ?? res.status}`);
      }

      toast.success("ファイルを添付しました");
      router.refresh();
    } catch (err) {
      console.error("attachment upload failed:", err);
      toast.error(err instanceof Error ? err.message : "アップロードに失敗しました");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAddUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!urlValue.trim()) return;

    setAddingUrl(true);
    try {
      const res = await fetch("/api/project-attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "url",
          project_id: projectId,
          note_id: noteId,
          external_url: urlValue.trim(),
          label: urlLabel.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "追加に失敗しました");
      }

      toast.success("リンクを追加しました");
      setUrlValue("");
      setUrlLabel("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setAddingUrl(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={`project-attachment-file-${noteId ?? "review"}`}>
          画像・PDFなどのファイル
        </Label>
        <Input
          id={`project-attachment-file-${noteId ?? "review"}`}
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
        />
        {uploading && <p className="text-xs text-muted-foreground">アップロード中...</p>}
      </div>

      <form onSubmit={handleAddUrl} className="space-y-1.5">
        <Label htmlFor={`project-attachment-url-${noteId ?? "review"}`}>URL</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            id={`project-attachment-url-${noteId ?? "review"}`}
            type="url"
            placeholder="https://..."
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            className="min-w-[200px] flex-1"
          />
          <Input
            placeholder="ラベル(任意)"
            value={urlLabel}
            onChange={(e) => setUrlLabel(e.target.value)}
            className="w-40"
          />
          <Button type="submit" size="sm" disabled={addingUrl}>
            追加
          </Button>
        </div>
      </form>
    </div>
  );
}
