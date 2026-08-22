import { cn } from "@/lib/utils";
import { ProjectQuickViewDialog } from "@/components/projects/project-quick-view-dialog";
import { ProjectPhaseBadge } from "@/components/projects/project-phase-badge";
import type { ProjectSummary } from "@/lib/projects/types";
import type { ProjectPhase } from "@/types/database.types";

// 「今動いているもの」ほど目立つように、フェーズごとにバーの濃淡を変える(バッジと同じ考え方)
const PHASE_BAR_CLASS: Record<ProjectPhase, string> = {
  concept: "border border-dashed border-border bg-transparent",
  researching: "bg-tint-blue",
  preparing: "bg-tint-yellow",
  active: "bg-primary",
  operating: "bg-tint-green",
  on_hold: "bg-muted-foreground/20",
  completed: "bg-muted-foreground/15",
};

export type GanttBarPosition = { leftPercent: number; widthPercent: number; ongoing: boolean };

export function GanttRow({
  project,
  bar,
}: {
  project: ProjectSummary;
  bar: GanttBarPosition | null;
}) {
  return (
    <ProjectQuickViewDialog project={project}>
      <div className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/40">
        <div className="flex w-64 shrink-0 items-center gap-1.5 overflow-hidden pr-2">
          <span className="truncate text-sm">{project.name}</span>
          <span className="ml-auto shrink-0">
            <ProjectPhaseBadge phase={project.phase} />
          </span>
        </div>
        <div className="relative h-7 flex-1">
          {bar && (
            <div
              className={cn(
                "absolute top-1/2 h-6 -translate-y-1/2 rounded-full",
                PHASE_BAR_CLASS[project.phase],
              )}
              style={{ left: `${bar.leftPercent}%`, width: `${bar.widthPercent}%` }}
            />
          )}
        </div>
      </div>
    </ProjectQuickViewDialog>
  );
}
