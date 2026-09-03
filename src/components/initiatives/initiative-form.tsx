"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INITIATIVE_PRIORITY_LABELS } from "./initiative-priority-badge";
import type { Initiative } from "@/lib/initiatives/types";
import type { InitiativePriority } from "@/types/database.types";

export function InitiativeForm({
  mode,
  initiative,
  onSaved,
  onCancel,
}: {
  mode: "create" | "edit";
  initiative?: Initiative;
  onSaved: (initiative: Initiative) => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState(initiative?.title ?? "");
  const [priority, setPriority] = useState<InitiativePriority>(initiative?.priority ?? "B");
  const [nextAction, setNextAction] = useState(initiative?.next_action ?? "");
  const [memo, setMemo] = useState(initiative?.memo ?? "");
  const [dueDate, setDueDate] = useState(initiative?.due_date ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title,
        priority,
        next_action: nextAction || null,
        memo: memo || null,
        due_date: dueDate || null,
      };

      const res = await fetch(
        mode === "create" ? "/api/initiatives" : `/api/initiatives/${initiative!.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "保存に失敗しました");
      }

      const { initiative: saved } = await res.json();
      toast.success(mode === "create" ? "取り組みを登録しました" : "更新しました");
      onSaved(saved);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="initiative-title">タイトル</Label>
        <Input
          id="initiative-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>優先度</Label>
        <Select
          items={INITIATIVE_PRIORITY_LABELS}
          value={priority}
          onValueChange={(v: string | null) => v && setPriority(v as InitiativePriority)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(INITIATIVE_PRIORITY_LABELS) as InitiativePriority[]).map((p) => (
              <SelectItem key={p} value={p}>
                {INITIATIVE_PRIORITY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="initiative-next">次にやること</Label>
        <Textarea
          id="initiative-next"
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="initiative-memo">メモ</Label>
        <Textarea
          id="initiative-memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="initiative-due">期限(任意)</Label>
        <Input
          id="initiative-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full sm:w-48"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit" disabled={submitting}>
          {mode === "create" ? "登録" : "更新"}
        </Button>
      </div>
    </form>
  );
}
