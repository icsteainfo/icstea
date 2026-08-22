import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/projects/queries";
import { Button } from "@/components/ui/button";
import { ProjectPhaseSelect } from "@/components/projects/project-phase-select";
import { ProjectQuickAddTask } from "@/components/projects/project-quick-add-task";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { ProjectNotes } from "@/components/projects/project-notes";
import { FinalReviewEditor } from "@/components/projects/final-review-editor";
import { TaskListItem } from "@/components/tasks/task-list-item";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const project = await getProject(supabase, id);
  if (!project) notFound();

  const openTasks = project.tasks.filter((t) => t.status === "open");
  const completedTasks = project.tasks.filter((t) => t.status === "completed");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          {project.category_name && (
            <p className="text-sm text-muted-foreground">{project.category_name}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProjectPhaseSelect projectId={project.id} phase={project.phase} />
          <Button variant="outline" render={<Link href={`/projects/${project.id}/edit`}>編集</Link>} />
          <DeleteProjectButton projectId={project.id} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-lg border p-3 text-center text-sm">
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
        <section className="space-y-1">
          <h2 className="text-sm font-semibold text-muted-foreground">目的</h2>
          <p className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm">
            {project.purpose}
          </p>
        </section>
      )}

      {project.memo && (
        <section className="space-y-1">
          <h2 className="text-sm font-semibold text-muted-foreground">メモ</h2>
          <p className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm">
            {project.memo}
          </p>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">経過感想</h2>
        <ProjectNotes projectId={project.id} initialNotes={project.notes} />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          関連Todo
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            未完了{openTasks.length}件 / 完了{completedTasks.length}件
          </span>
        </h2>

        <ProjectQuickAddTask projectId={project.id} />

        {openTasks.length === 0 && completedTasks.length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
            まだTodoがありません
          </p>
        ) : (
          <div className="space-y-2">
            {openTasks.map((task) => (
              <TaskListItem key={task.id} task={task} />
            ))}
            {completedTasks.map((task) => (
              <TaskListItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      <FinalReviewEditor projectId={project.id} finalReview={project.final_review} />
    </div>
  );
}
