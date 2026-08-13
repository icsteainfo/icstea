"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  RecurrenceRuleEditor,
  computeDueOffsetDays,
  isRecurrenceRuleValid,
  DEFAULT_RECURRENCE_RULE_VALUE,
  type RecurrenceRuleValue,
} from "@/components/tasks/recurrence-rule-editor";

export function MakeRecurringButton({
  taskId,
  taskTitle,
}: {
  taskId: string;
  taskTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rule, setRule] = useState<RecurrenceRuleValue>(DEFAULT_RECURRENCE_RULE_VALUE);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!isRecurrenceRuleValid(rule)) {
      toast.error("期限の日は、出現する日と同じか後の日にしてください");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/create-recurrence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recurrence_type: rule.recurrenceType,
          recurrence_config:
            rule.recurrenceType === "weekly"
              ? { weekday: rule.weekday }
              : rule.recurrenceType === "monthly_on_day"
                ? { dayOfMonth: rule.dayOfMonth }
                : null,
          due_offset_days: computeDueOffsetDays(rule),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "繰り返しの設定に失敗しました");
      }
      toast.success("繰り返しTodoに設定しました");
      setOpen(false);
      router.push("/recurrence");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "繰り返しの設定に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setRule(DEFAULT_RECURRENCE_RULE_VALUE);
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        この繰り返しにする
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>「{taskTitle}」を繰り返しTodoにする</DialogTitle>
          <DialogDescription>
            Todo名・カテゴリー・担当者・優先度・サブタスクは、この既存Todoの内容をそのまま引き継ぎます。繰り返しのルールだけ設定してください。
          </DialogDescription>
        </DialogHeader>
        <RecurrenceRuleEditor value={rule} onChange={setRule} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "設定中..." : "設定する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
