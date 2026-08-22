"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProjectQuickAddTask({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          due_date: dueDate || null,
          assignee_type: "owner",
          project_id: projectId,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "追加に失敗しました");
      }
      setTitle("");
      setDueDate("");
      toast.success("Todoを追加しました");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 rounded-lg border border-dashed p-3">
      <Input
        placeholder="Todoを追加(例: 会場を予約する)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="min-w-48 flex-1"
      />
      <Input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-40"
      />
      <Button type="submit" size="sm" disabled={submitting}>
        追加
      </Button>
    </form>
  );
}
