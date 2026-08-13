"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TemplateSubtaskForm({
  templateId,
  onCreated,
}: {
  templateId: string;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/templates/${templateId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "追加に失敗しました");
      }
      setTitle("");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="サブタスクを追加(例: レシピ確定)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Button type="submit" disabled={submitting}>
        追加
      </Button>
    </form>
  );
}
