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
import { PROJECT_PHASE_LABELS } from "./project-phase-badge";
import type { Project } from "@/lib/projects/types";
import type { Category } from "@/lib/tasks/types";
import type { ProjectPhase } from "@/types/database.types";

export function ProjectForm({
  mode,
  project,
  categories,
}: {
  mode: "create" | "edit";
  project?: Project;
  categories: Category[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState(project?.name ?? "");
  const [categoryId, setCategoryId] = useState(project?.category_id ?? "");
  const [phase, setPhase] = useState<ProjectPhase>(project?.phase ?? "concept");
  const [purpose, setPurpose] = useState(project?.purpose ?? "");
  const [memo, setMemo] = useState(project?.memo ?? "");
  const [startDate, setStartDate] = useState(project?.start_date ?? "");
  const [dueDate, setDueDate] = useState(project?.due_date ?? "");
  const [endDate, setEndDate] = useState(project?.end_date ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!categoryId) {
      toast.error("カテゴリを選択してください");
      return;
    }
    if (startDate && dueDate && startDate > dueDate) {
      toast.error("日付の前後関係を見直してください(開始日 ≦ 目標日 ≦ 終了日)");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        category_id: categoryId,
        phase,
        purpose: purpose || null,
        memo: memo || null,
        start_date: startDate || null,
        due_date: dueDate || null,
        end_date: endDate || null,
      };

      const res = await fetch(
        mode === "create" ? "/api/projects" : `/api/projects/${project!.id}`,
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

      const body = await res.json();
      const id = mode === "create" ? body.project.id : project!.id;

      toast.success(mode === "create" ? "プロジェクトを登録しました" : "更新しました");
      router.push(`/projects/${id}`);
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
        <Label htmlFor="name">プロジェクト名</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>カテゴリ</Label>
          <Select
            items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
            value={categoryId}
            onValueChange={(v: string | null) => setCategoryId(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="カテゴリを選択" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>フェーズ</Label>
          <Select
            items={PROJECT_PHASE_LABELS}
            value={phase}
            onValueChange={(v: string | null) => v && setPhase(v as ProjectPhase)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PROJECT_PHASE_LABELS) as ProjectPhase[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {PROJECT_PHASE_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
          <Label htmlFor="due_date">目標日(任意)</Label>
          <Input
            id="due_date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">終了日(任意)</Label>
          <Input
            id="end_date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        目標日が未定のプロジェクトも登録できます。終了日はフェーズを「完了」にすると自動で記録されます(手動での修正も可能)。
      </p>

      <div className="space-y-2">
        <Label htmlFor="purpose">目的</Label>
        <Textarea
          id="purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          rows={3}
          placeholder="なぜこれをやるのか"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="memo">メモ</Label>
        <Textarea
          id="memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={4}
          placeholder="経緯や詳細など、自由に書けるメモです"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/projects")}
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={submitting}>
          {mode === "create" ? "登録" : "更新"}
        </Button>
      </div>
    </form>
  );
}
