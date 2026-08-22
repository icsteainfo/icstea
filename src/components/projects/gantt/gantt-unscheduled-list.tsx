import { ProjectQuickViewDialog } from "@/components/projects/project-quick-view-dialog";
import { ProjectPhaseBadge } from "@/components/projects/project-phase-badge";
import type { ProjectSummary } from "@/lib/projects/types";

export function GanttUnscheduledList({ projects }: { projects: ProjectSummary[] }) {
  if (projects.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border border-dashed p-3">
      <p className="text-sm font-semibold text-muted-foreground">
        日程未定 <span className="font-normal">{projects.length}件</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {projects.map((project) => (
          <ProjectQuickViewDialog key={project.id} project={project}>
            <div className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-sm hover:bg-muted/40">
              {project.name}
              <ProjectPhaseBadge phase={project.phase} />
            </div>
          </ProjectQuickViewDialog>
        ))}
      </div>
    </div>
  );
}
