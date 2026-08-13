"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TaskTemplateWithRelations } from "@/lib/templates/types";

export function CreateFromTemplateForm({
  templates,
}: {
  templates: TaskTemplateWithRelations[];
}) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!templateId) {
      toast.error("テンプレートを選択してください");
      return;
    }
    if (!title.trim()) {
      toast.error("タスク名を入力してください");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks/from-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId, title }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "作成に失敗しました");
      }
      const { task } = await res.json();
      toast.success("タスクを作成しました");
      router.push(`/tasks/${task.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (templates.length === 0) {
    return (
      <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
        テンプレートがまだありません。先に「テンプレート」画面から作成してください。
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>テンプレート</Label>
        <Select
          items={Object.fromEntries(templates.map((t) => [t.id, t.name]))}
          value={templateId}
          onValueChange={(v: string | null) => v && setTemplateId(v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">大項目名</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 9月限定 白桃アールグレイ"
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/tasks")}
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={submitting}>
          作成
        </Button>
      </div>
    </form>
  );
}
