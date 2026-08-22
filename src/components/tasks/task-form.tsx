"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecurrenceEditor } from "@/components/tasks/recurrence-editor";
import type { Category, Staff, TaskWithRelations } from "@/lib/tasks/types";
import type { Project } from "@/lib/projects/types";
import type { PriorityLevel, RecurrenceType } from "@/types/database.types";

const NO_CATEGORY = "__none__";
const NO_PROJECT = "__none__";

const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  urgent: "緊急",
  high: "高",
  medium: "中",
  low: "低",
};

export function TaskForm({
  mode,
  task,
  categories,
  staff,
  projects,
  defaultProjectId,
  hideActions,
}: {
  mode: "create" | "edit";
  task?: TaskWithRelations;
  categories: Category[];
  staff: Staff[];
  projects: Project[];
  defaultProjectId?: string;
  hideActions?: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState(task?.title ?? "");
  const [memo, setMemo] = useState(task?.memo ?? "");
  const [categoryId, setCategoryId] = useState(
    task?.category_id ?? NO_CATEGORY,
  );
  const [projectId, setProjectId] = useState(
    task?.project_id ?? defaultProjectId ?? NO_PROJECT,
  );
  const [assigneeType, setAssigneeType] = useState<"owner" | "staff">(
    task?.assignee_type ?? "owner",
  );
  const [assigneeStaffId, setAssigneeStaffId] = useState(
    task?.assignee_staff_id ?? "",
  );
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [startDate, setStartDate] = useState(task?.start_date ?? "");
  const [isWaiting, setIsWaiting] = useState(task?.is_waiting ?? false);
  const [waitingFollowUpDate, setWaitingFollowUpDate] = useState(
    task?.waiting_follow_up_date ?? "",
  );
  const [waitingNote, setWaitingNote] = useState(task?.waiting_note ?? "");
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>(
    task?.priority_level ?? "medium",
  );

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("daily");
  const [weekday, setWeekday] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (assigneeType === "staff" && !assigneeStaffId) {
      toast.error("担当スタッフを選択してください");
      return;
    }
    if (startDate && dueDate && startDate > dueDate) {
      toast.error("開始日は期限と同じか、それより前の日にしてください");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "create" && isRecurring) {
        const res = await fetch("/api/recurrence-series", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            memo: memo || null,
            category_id: categoryId === NO_CATEGORY ? null : categoryId,
            assignee_type: assigneeType,
            assignee_staff_id: assigneeType === "staff" ? assigneeStaffId : null,
            recurrence_type: recurrenceType,
            recurrence_config:
              recurrenceType === "weekly"
                ? { weekday }
                : recurrenceType === "monthly_on_day"
                  ? { dayOfMonth }
                  : null,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "保存に失敗しました");
        }

        toast.success("繰り返しタスクを登録しました");
        router.push("/tasks");
        router.refresh();
        return;
      }

      const payload = {
        title,
        memo: memo || null,
        category_id: categoryId === NO_CATEGORY ? null : categoryId,
        project_id: projectId === NO_PROJECT ? null : projectId,
        assignee_type: assigneeType,
        assignee_staff_id: assigneeType === "staff" ? assigneeStaffId : null,
        due_date: dueDate || null,
        start_date: startDate || null,
        is_waiting: isWaiting,
        waiting_follow_up_date: isWaiting ? waitingFollowUpDate || null : null,
        waiting_note: isWaiting ? waitingNote || null : null,
        priority_level: priorityLevel,
      };

      const res = await fetch(
        mode === "create" ? "/api/tasks" : `/api/tasks/${task!.id}`,
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

      toast.success(mode === "create" ? "タスクを登録しました" : "更新しました");
      router.push("/tasks");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form id="task-form" onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">タスク名</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

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
        <Label>関連プロジェクト</Label>
        <Select
          items={{
            [NO_PROJECT]: "未設定",
            ...Object.fromEntries(projects.map((p) => [p.id, p.name])),
          }}
          value={projectId}
          onValueChange={(v: string | null) => setProjectId(v ?? NO_PROJECT)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="プロジェクトを選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_PROJECT}>未設定</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isRecurring && (
        <div className="space-y-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">開始日(任意)</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">期限</Label>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            開始日を入力すると、開始日から期限までの期間、毎日「今日やること」に表示され続けます。空欄なら今まで通り期限の日だけ表示されます。
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>優先度</Label>
        <Select
          items={PRIORITY_LABELS}
          value={priorityLevel}
          onValueChange={(v: string | null) =>
            v && setPriorityLevel(v as PriorityLevel)
          }
        >
          <SelectTrigger className="w-full sm:w-48">
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

      <div className="space-y-2">
        <Label htmlFor="memo">メモ</Label>
        <p className="text-xs text-muted-foreground">
          経緯や詳細など、自由に書けるメモです。添付ファイルやリンクとは別に保存されます。
        </p>
        <Textarea
          id="memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={8}
          placeholder="長文でも入力できます"
        />
      </div>

      {mode === "create" && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked === true)}
            />
            <Label htmlFor="is_recurring" className="cursor-pointer">
              繰り返しタスクにする
            </Label>
          </div>

          {isRecurring && (
            <RecurrenceEditor
              recurrenceType={recurrenceType}
              onRecurrenceTypeChange={setRecurrenceType}
              weekday={weekday}
              onWeekdayChange={setWeekday}
              dayOfMonth={dayOfMonth}
              onDayOfMonthChange={setDayOfMonth}
            />
          )}
        </div>
      )}

      {!isRecurring && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_waiting"
              checked={isWaiting}
              onCheckedChange={(checked) => setIsWaiting(checked === true)}
            />
            <Label htmlFor="is_waiting" className="cursor-pointer">
              対応待ち(相手からの返信待ちなど)
            </Label>
          </div>

          {isWaiting && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="follow_up">再確認日</Label>
                <Input
                  id="follow_up"
                  type="date"
                  value={waitingFollowUpDate}
                  onChange={(e) => setWaitingFollowUpDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waiting_note">対応待ちメモ</Label>
                <Input
                  id="waiting_note"
                  value={waitingNote}
                  onChange={(e) => setWaitingNote(e.target.value)}
                  placeholder="例: ○○社からの返信待ち"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {!hideActions && (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/tasks")}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={submitting}>
            {mode === "create" ? "登録" : "更新"}
          </Button>
        </div>
      )}
    </form>
  );
}
