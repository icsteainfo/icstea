"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Staff } from "@/lib/tasks/types";

export function SubtaskForm({
  taskId,
  staff,
  onCreated,
}: {
  taskId: string;
  staff: Staff[];
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeType, setAssigneeType] = useState<"owner" | "staff">("owner");
  const [assigneeStaffId, setAssigneeStaffId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (assigneeType === "staff" && !assigneeStaffId) {
      toast.error("担当スタッフを選択してください");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          due_date: dueDate || null,
          assignee_type: assigneeType,
          assignee_staff_id: assigneeType === "staff" ? assigneeStaffId : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "追加に失敗しました");
      }
      setTitle("");
      setDueDate("");
      setAssigneeType("owner");
      setAssigneeStaffId("");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border border-dashed p-3">
      <Input
        placeholder="サブタスクを追加(例: 紙袋を選定する)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-40"
        />
        <Select
          items={{ owner: "自分", staff: "スタッフ" }}
          value={assigneeType}
          onValueChange={(v) => setAssigneeType(v as "owner" | "staff")}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="owner">自分</SelectItem>
            <SelectItem value="staff">スタッフ</SelectItem>
          </SelectContent>
        </Select>
        {assigneeType === "staff" && (
          <Select
            items={Object.fromEntries(staff.map((s) => [s.id, s.name]))}
            value={assigneeStaffId}
            onValueChange={(v: string | null) => setAssigneeStaffId(v ?? "")}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="スタッフ" />
            </SelectTrigger>
            <SelectContent>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button type="submit" size="sm" disabled={submitting} className="ml-auto">
          追加
        </Button>
      </div>
    </form>
  );
}
