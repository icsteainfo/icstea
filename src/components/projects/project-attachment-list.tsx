"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileIcon, LinkIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { PROJECT_ATTACHMENTS_BUCKET } from "@/lib/project-attachments/queries";
import type { ProjectAttachment } from "@/lib/project-attachments/types";

export function ProjectAttachmentList({ attachments }: { attachments: ProjectAttachment[] }) {
  const router = useRouter();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleOpen(attachment: ProjectAttachment) {
    if (attachment.kind === "url") {
      window.open(attachment.external_url ?? "", "_blank", "noopener,noreferrer");
      return;
    }

    if (!attachment.storage_path) return;
    setOpeningId(attachment.id);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from(PROJECT_ATTACHMENTS_BUCKET)
        .createSignedUrl(attachment.storage_path, 60);
      if (error || !data) throw error ?? new Error();
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("ファイルを開けませんでした");
    } finally {
      setOpeningId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/project-attachments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("削除しました");
      router.refresh();
    } catch {
      toast.error("削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  }

  if (attachments.length === 0) {
    return <p className="text-sm text-muted-foreground">添付はまだありません</p>;
  }

  return (
    <div className="space-y-2">
      {attachments.map((a) => (
        <div
          key={a.id}
          className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2.5"
        >
          <button
            type="button"
            onClick={() => handleOpen(a)}
            disabled={openingId === a.id}
            className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm hover:underline"
          >
            {a.kind === "url" ? (
              <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">{a.label || a.file_name || a.external_url}</span>
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={deletingId === a.id}
            onClick={() => handleDelete(a.id)}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
