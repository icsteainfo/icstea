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
import {
  RecurrenceRuleEditor,
  computeDueOffsetDays,
  deriveRecurrenceRuleValue,
  isRecurrenceRuleValid,
  DEFAULT_RECURRENCE_RULE_VALUE,
  type RecurrenceRuleValue,
} from "@/components/tasks/recurrence-rule-editor";
import type { Category, RecurrenceSeriesWithSubtasks, Staff } from "@/lib/tasks/types";
import type { PriorityLevel } from "@/types/database.types";

const NO_CATEGORY = "__none__";

const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  urgent: "緊急",
  high: "高",
  medium: "中",
  low: "低",
};

export function RecurrenceSeriesForm({
  categories,
  staff,
  initial,
}: {
  categories: Category[];
  staff: Staff[];
  initial?: RecurrenceSeriesWithSubtasks;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!initial;

  const [title, setTitle] = useState(initial?.title_template ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? NO_CATEGORY);
  const [assigneeType, setAssigneeType] = useState<"owner" | "staff">(
    initial?.assignee_type ?? "owner",
  );
  const [assigneeStaffId, setAssigneeStaffId] = useState(initial?.assignee_staff_id ?? "");
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>(
    initial?.priority_level ?? "medium",
  );
  const [memo, setMemo] = useState(initial?.memo_template ?? "");

  const [rule, setRule] = useState<RecurrenceRuleValue>(
    initial ? deriveRecurrenceRuleValue(initial) : DEFAULT_RECURRENCE_RULE_VALUE,
  );

  const [subtaskInput, setSubtaskInput] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>(
    initial?.subtasks.map((s) => s.title) ?? [],
  );

  function addSubtask() {
    if (!subtaskInput.trim()) return;
    setSubtasks((prev) => [...prev, subtaskInput.trim()]);
    setSubtaskInput("");
  }

  function removeSubtask(index: number) {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Todo名を入力してください");
      return;
    }
    if (assigneeType === "staff" && !assigneeStaffId) {
      toast.error("担当スタッフを選択してください");
      return;
    }
    if (!isRecurrenceRuleValid(rule)) {
      toast.error("期限の日は、出現する日と同じか後の日にしてください");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `/api/recurrence-series/${initial.id}` : "/api/recurrence-series",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            memo: memo || null,
            category_id: categoryId === NO_CATEGORY ? null : categoryId,
            assignee_type: assigneeType,
            assignee_staff_id: assigneeType === "staff" ? assigneeStaffId : null,
            priority_level: priorityLevel,
            recurrence_type: rule.recurrenceType,
            recurrence_config:
              rule.recurrenceType === "weekly"
                ? { weekday: rule.weekday }
                : rule.recurrenceType === "monthly_on_day"
                  ? { dayOfMonth: rule.dayOfMonth }
                  : null,
            due_offset_days: computeDueOffsetDays(rule),
            subtasks: subtasks.map((t) => ({ title: t })),
          }),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? (isEdit ? "更新に失敗しました" : "登録に失敗しました"));
      }

      toast.success(isEdit ? "繰り返しTodoを更新しました" : "繰り返しTodoを登録しました");
      router.push("/home");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : isEdit ? "更新に失敗しました" : "登録に失敗しました",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Todo名</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>カテゴリー</Label>
          <Select
            items={{
              [NO_CATEGORY]: "未設定",
              ...Object.fromEntries(categories.map((c) => [c.id, c.name])),
            }}
            value={categoryId}
            onValueChange={(v: string | null) => setCategoryId(v ?? NO_CATEGORY)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="カテゴリーを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CATEGORY}>未設定</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>優先度</Label>
          <Select
            items={PRIORITY_LABELS}
            value={priorityLevel}
            onValueChange={(v: string | null) => v && setPriorityLevel(v as PriorityLevel)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PRIORITY_LABELS) as PriorityLevel[]).map((level) => (
                <SelectItem key={level} value={level}>
                  {PRIORITY_LABELS[level]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>担当</Label>
          <Select
            items={{ owner: "自分", staff: "スタッフ" }}
            value={assigneeType}
            onValueChange={(v) => setAssigneeType(v as "owner" | "staff")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">自分</SelectItem>
              <SelectItem value="staff">スタッフ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {assigneeType === "staff" && (
          <div className="space-y-2">
            <Label>担当スタッフ</Label>
            <Select
              items={Object.fromEntries(staff.map((s) => [s.id, s.name]))}
              value={assigneeStaffId}
              onValueChange={(v: string | null) => setAssigneeStaffId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="スタッフを選択" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <RecurrenceRuleEditor value={rule} onChange={setRule} />

      <div className="space-y-2 rounded-lg border p-4">
        <Label>サブタスク(毎回自動でコピーされます)</Label>
        <div className="flex gap-2">
          <Input
            value={subtaskInput}
            onChange={(e) => setSubtaskInput(e.target.value)}
            placeholder="サブタスクを追加"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSubtask();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addSubtask}>
            追加
          </Button>
        </div>
        {subtasks.length > 0 && (
          <ul className="space-y-1.5 pt-1">
            {subtasks.map((s, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-md border bg-background px-2.5 py-1.5 text-sm"
              >
                {s}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeSubtask(i)}
                >
                  削除
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="memo">メモ</Label>
        <Textarea id="memo" value={memo} onChange={(e) => setMemo(e.target.value)} rows={4} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/home")}>
          キャンセル
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (isEdit ? "更新中..." : "登録中...") : isEdit ? "更新" : "登録"}
        </Button>
      </div>
    </form>
  );
}
