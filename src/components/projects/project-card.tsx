import Link from "next/link";
import { ProjectPhaseBadge } from "./project-phase-badge";
import type { ProjectSummary } from "@/lib/projects/types";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block space-y-2 rounded-lg border bg-background p-4 hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{project.name}</p>
        <ProjectPhaseBadge phase={project.phase} />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {project.category_name && <span>{project.category_name}</span>}
        {project.due_date && <span>目標日: {formatDate(project.due_date)}</span>}
      </div>
    </Link>
  );
}
