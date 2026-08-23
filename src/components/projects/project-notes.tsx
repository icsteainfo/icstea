"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiagramView } from "./diagram/diagram-view";
import { DiagramNoteDialog } from "./diagram-note-dialog";
import { ProjectAttachmentList } from "./project-attachment-list";
import { ProjectAttachmentUploader } from "./project-attachment-uploader";
import type { ProjectNote } from "@/lib/projects/types";
import type { ProjectAttachment } from "@/lib/project-attachments/types";

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

export function ProjectNotes({
  projectId,
  initialNotes,
  attachments,
}: {
  projectId: string;
  initialNotes: ProjectNote[];
  attachments: ProjectAttachment[];
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [mode, setMode] = useState<"text" | "diagram">("text");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  // router.refresh()でサーバーから新しいinitialNotesが渡されたら、ローカル状態を追従させる
  const [prevInitialNotes, setPrevInitialNotes] = useState(initialNotes);
  if (initialNotes !== prevInitialNotes) {
    setPrevInitialNotes(initialNotes);
    setNotes(initialNotes);
  }

  async function handleAddText(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_type: "text", content }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "追加に失敗しました");
      }
      setContent("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(noteId: string) {
    const previous = notes;
    setNotes(notes.filter((n) => n.id !== noteId));
    try {
      const res = await fetch(`/api/project-notes/${noteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setNotes(previous);
      toast.error("削除に失敗しました");
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-lg border border-dashed p-3">
        <Tabs value={mode} onValueChange={(v) => v && setMode(v as "text" | "diagram")}>
          <TabsList>
            <TabsTrigger value="text">テキスト</TabsTrigger>
            <TabsTrigger value="diagram">関連図</TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === "text" ? (
          <form onSubmit={handleAddText} className="space-y-2">
            <Textarea
              placeholder="経過感想を記録する(例: 会場の目処が立った。あとは仕入れ先の調整のみ)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={submitting}>
                追加
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              要因やできごとをノードにして矢印でつなぎ、関連図として記録できます。
            </p>
            <DiagramNoteDialog projectId={projectId} />
          </div>
        )}
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">まだ経過感想はありません</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border bg-background p-3">
              <div className="flex items-start justify-between gap-2">
                {note.note_type === "diagram" ? (
                  <p className="text-sm font-medium">{note.content || "関連図"}</p>
                ) : (
                  <p className="whitespace-pre-wrap text-sm">{note.content}</p>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => handleDelete(note.id)}
                >
                  削除
                </Button>
              </div>

              {note.note_type === "diagram" && note.diagram && (
                <div className="mt-2">
                  <DiagramView diagram={note.diagram} />
                </div>
              )}

              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">{formatDateTime(note.created_at)}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                >
                  {expandedNoteId === note.id ? "閉じる" : "＋ 添付"}
                </Button>
              </div>

              {(() => {
                const noteAttachments = attachments.filter((a) => a.note_id === note.id);
                if (noteAttachments.length === 0 && expandedNoteId !== note.id) return null;
                return (
                  <div className="mt-1.5 space-y-2">
                    {noteAttachments.length > 0 && (
                      <ProjectAttachmentList attachments={noteAttachments} />
                    )}
                    {expandedNoteId === note.id && (
                      <ProjectAttachmentUploader projectId={projectId} noteId={note.id} />
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
