"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectPhaseBadge } from "./project-phase-badge";
import type { ProjectSummary } from "@/lib/projects/types";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export function ProjectQuickViewDialog({
  project,
  children,
}: {
  project: ProjectSummary;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const openTasks = project.tasks.filter((t) => t.status === "open");
  const completedTasks = project.tasks.filter((t) => t.status === "completed");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen(true);
        }}
        className="w-full cursor-pointer text-left"
      >
        {children}
      </div>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {project.name}
            <ProjectPhaseBadge phase={project.phase} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {project.category_name && (
            <p className="text-muted-foreground">{project.category_name}</p>
          )}

          <div className="grid grid-cols-3 gap-2 rounded-lg border p-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">開始日</p>
              <p>{formatDate(project.start_date) ?? "未定"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">目標日</p>
              <p>{formatDate(project.due_date) ?? "未定"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">終了日</p>
              <p>{formatDate(project.end_date) ?? "-"}</p>
            </div>
          </div>

          {project.purpose && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground">目的</p>
              <p className="whitespace-pre-wrap">{project.purpose}</p>
            </div>
          )}

          {project.memo && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground">メモ</p>
              <p className="whitespace-pre-wrap">{project.memo}</p>
            </div>
          )}

          <div>
            <p className="mb-1 text-xs font-semibold text-muted-foreground">
              関連Todo(未完了{openTasks.length}件 / 完了{completedTasks.length}件)
            </p>
            {project.tasks.length === 0 ? (
              <p className="text-muted-foreground">まだTodoがありません</p>
            ) : (
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {openTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-1.5">
                    <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    {t.title}
                  </li>
                ))}
                {completedTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-1.5 text-muted-foreground line-through">
                    <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                    {t.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            閉じる
          </Button>
          <Button render={<Link href={`/projects/${project.id}`}>詳細を開く</Link>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
