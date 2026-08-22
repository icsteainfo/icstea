"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function NotesSection({
  reviewId,
  initialNotes,
}: {
  reviewId: string;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const dirty = notes !== (initialNotes ?? "");

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/monthly-reviews/${reviewId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_notes: notes || null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "保存に失敗しました");
      }
      toast.success("MTGメモを保存しました");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={10}
        placeholder="社長・経理とのMTGで話した内容を記入してください(売上の傾向、気になっている経費、次月の方針の話し合いなど)"
      />
      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={saving || !dirty}>
          {saving ? "保存中..." : "メモを保存"}
        </Button>
      </div>
    </div>
  );
}
