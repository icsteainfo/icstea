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
import { INITIATIVE_STATUS_LABELS } from "./initiative-status-badge";
import type { Initiative } from "@/lib/initiatives/types";
import type { InitiativeStatus } from "@/types/database.types";

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
  const [status, setStatus] = useState<InitiativeStatus>(initiative?.status ?? "want");
  const [nextAction, setNextAction] = useState(initiative?.next_action ?? "");
  const [memo, setMemo] = useState(initiative?.memo ?? "");
  const [dueDate, setDueDate] = useState(initiative?.due_date ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title,
        status,
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
        <Label>ステータス</Label>
        <Select
          items={INITIATIVE_STATUS_LABELS}
          value={status}
          onValueChange={(v: string | null) => v && setStatus(v as InitiativeStatus)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(INITIATIVE_STATUS_LABELS) as InitiativeStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {INITIATIVE_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="initiative-next">次にやること</Label>
        <p className="text-xs text-muted-foreground">直近で自分がやるアクション</p>
        <Textarea
          id="initiative-next"
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          rows={2}
          placeholder="例: 海外送金方法を決めて支払う"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="initiative-memo">メモ</Label>
        <p className="text-xs text-muted-foreground">
          思いついたことを自由に書けるメモです。Todoにするほどではない確認事項や忘れたくないことなど。
        </p>
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
