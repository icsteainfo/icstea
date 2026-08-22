import { ChevronDown } from "lucide-react";
import { GanttRow, type GanttBarPosition } from "./gantt-row";
import type { ProjectSummary } from "@/lib/projects/types";

export function GanttCategoryGroup({
  label,
  items,
}: {
  label: string;
  items: { project: ProjectSummary; bar: GanttBarPosition | null }[];
}) {
  return (
    <details className="group" open>
      <summary className="flex cursor-pointer list-none items-center gap-1.5 py-1 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        {label}
        <span className="font-normal text-muted-foreground">{items.length}件</span>
      </summary>
      <div className="space-y-0.5 pb-2 pt-1">
        {items.map(({ project, bar }) => (
          <GanttRow key={project.id} project={project} bar={bar} />
        ))}
      </div>
    </details>
  );
}
