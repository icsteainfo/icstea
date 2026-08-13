"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, Staff } from "@/lib/tasks/types";
import type { PriorityLevel } from "@/types/database.types";

const NO_CATEGORY = "__none__";
const NO_ASSIGNEE = "__owner__";

const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  urgent: "緊急",
  high: "高",
  medium: "中",
  low: "低",
};

export type EditableSubtask = { title: string; completed: boolean };

export type EditableCandidate = {
  id: string;
  action: "create" | "attach" | "exclude";
  title: string;
  subtasks: EditableSubtask[];
  categoryId: string | null;
  dueDate: string | null;
  assigneeStaffId: string | null;
  priority: PriorityLevel;
  templateId: string | null;
  templateApplied: boolean;
  duplicateTaskIds: string[];
  targetExistingTaskId: string | null;
};

type TemplateOption = {
  id: string;
  name: string;
  categoryId: string | null;
  subtaskTitles: string[];
};

type DuplicateCandidate = { id: string; title: string };

export function BulkImportCandidateCard({
  candidate,
  categories,
  staff,
  templates,
  duplicateCandidates,
  onChange,
}: {
  candidate: EditableCandidate;
  categories: Category[];
  staff: Staff[];
  templates: TemplateOption[];
  duplicateCandidates: DuplicateCandidate[];
  onChange: (patch: Partial<EditableCandidate>) => void;
}) {
  const matchedTemplate = templates.find((t) => t.id === candidate.templateId);
  const duplicates = duplicateCandidates.filter((d) =>
    candidate.duplicateTaskIds.includes(d.id),
  );

  function applyTemplate() {
    if (!matchedTemplate) return;
    onChange({
      categoryId: matchedTemplate.categoryId,
      subtasks: matchedTemplate.subtaskTitles.map((title) => ({
        title,
        completed: false,
      })),
      templateApplied: true,
    });
  }

  function updateSubtask(index: number, patch: Partial<EditableSubtask>) {
    const subtasks = candidate.subtasks.map((s, i) =>
      i === index ? { ...s, ...patch } : s,
    );
    onChange({ subtasks });
  }

  function removeSubtask(index: number) {
    onChange({ subtasks: candidate.subtasks.filter((_, i) => i !== index) });
  }

  function addSubtask() {
    onChange({ subtasks: [...candidate.subtasks, { title: "", completed: false }] });
  }

  const excluded = candidate.action === "exclude";

  return (
    <div className="space-y-4 rounded-lg border p-4">
      {matchedTemplate && !candidate.templateApplied && (
        <div className="flex items-center justify-between rounded-md border border-dashed bg-muted/50 p-3 text-sm">
          <span>テンプレート「{matchedTemplate.name}」の内容が使えそうです</span>
          <Button type="button" size="sm" variant="outline" onClick={applyTemplate}>
            テンプレートを適用
          </Button>
        </div>
      )}

      {duplicates.length > 0 ? (
        <div className="space-y-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm dark:bg-warning/20">
          <p>
            既存タスクと重複している可能性があります:{" "}
            {duplicates.map((d) => d.title).join(" / ")}
          </p>
          <Select
            items={{
              create: "新規登録する",
              attach: "既存タスクにサブタスクとして追加する",
              exclude: "登録しない",
            }}
            value={candidate.action}
            onValueChange={(v: string | null) =>
              v && onChange({ action: v as EditableCandidate["action"] })
            }
          >
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="create">新規登録する</SelectItem>
              <SelectItem value="attach">既存タスクにサブタスクとして追加する</SelectItem>
              <SelectItem value="exclude">登録しない</SelectItem>
            </SelectContent>
          </Select>

          {candidate.action === "attach" && (
            <Select
              items={Object.fromEntries(duplicates.map((d) => [d.id, d.title]))}
              value={candidate.targetExistingTaskId ?? ""}
              onValueChange={(v: string | null) =>
                onChange({ targetExistingTaskId: v })
              }
            >
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="追加先のタスクを選択" />
              </SelectTrigger>
              <SelectContent>
                {duplicates.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Checkbox
            id={`include-${candidate.id}`}
            checked={!excluded}
            onCheckedChange={(checked) =>
              onChange({ action: checked === true ? "create" : "exclude" })
            }
          />
          <Label htmlFor={`include-${candidate.id}`} className="cursor-pointer">
            このTodoを登録する
          </Label>
        </div>
      )}

      <fieldset disabled={excluded} className="space-y-4 disabled:opacity-50">
        <div className="space-y-2">
          <Label>大項目名</Label>
          <Input
            value={candidate.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>サブタスク</Label>
          <div className="space-y-2">
            {candidate.subtasks.map((subtask, index) => (
              <div key={index} className="flex items-center gap-2">
                <Checkbox
                  checked={subtask.completed}
                  onCheckedChange={(checked) =>
                    updateSubtask(index, { completed: checked === true })
                  }
                />
                <Input
                  value={subtask.title}
                  onChange={(e) => updateSubtask(index, { title: e.target.value })}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeSubtask(index)}
                >
                  削除
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addSubtask}>
            サブタスクを追加
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>カテゴリー</Label>
            <Select
              items={{
                [NO_CATEGORY]: "未設定",
                ...Object.fromEntries(categories.map((c) => [c.id, c.name])),
              }}
              value={candidate.categoryId ?? NO_CATEGORY}
              onValueChange={(v: string | null) =>
                onChange({ categoryId: v === NO_CATEGORY ? null : v })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
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
            <Label>期限</Label>
            <Input
              type="date"
              value={candidate.dueDate ?? ""}
              onChange={(e) => onChange({ dueDate: e.target.value || null })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>担当</Label>
            <Select
              items={{
                [NO_ASSIGNEE]: "自分",
                ...Object.fromEntries(staff.map((s) => [s.id, s.name])),
              }}
              value={candidate.assigneeStaffId ?? NO_ASSIGNEE}
              onValueChange={(v: string | null) =>
                onChange({ assigneeStaffId: v === NO_ASSIGNEE ? null : v })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ASSIGNEE}>自分</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>優先度</Label>
            <Select
              items={PRIORITY_LABELS}
              value={candidate.priority}
              onValueChange={(v: string | null) =>
                v && onChange({ priority: v as PriorityLevel })
              }
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
      </fieldset>
    </div>
  );
}
