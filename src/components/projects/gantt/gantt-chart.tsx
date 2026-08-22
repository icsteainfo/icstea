import { GanttHeader } from "./gantt-header";
import { GanttCategoryGroup } from "./gantt-category-group";
import { GanttUnscheduledList } from "./gantt-unscheduled-list";
import { ganttOverlayLeft, type MonthBucket } from "@/lib/projects/gantt";
import type { GanttBarPosition } from "./gantt-row";
import type { ProjectSummary } from "@/lib/projects/types";

export type GanttCategoryGroupData = {
  key: string;
  label: string;
  items: { project: ProjectSummary; bar: GanttBarPosition | null }[];
};

export function GanttChart({
  months,
  todayPercent,
  groups,
  unscheduled,
}: {
  months: MonthBucket[];
  todayPercent: number | null;
  groups: GanttCategoryGroupData[];
  unscheduled: ProjectSummary[];
}) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0">
          {months.slice(1).map((_, i) => (
            <div
              key={i}
              className="absolute inset-y-0 w-px bg-border/50"
              style={{ left: ganttOverlayLeft((i + 1) / months.length) }}
            />
          ))}
          {todayPercent !== null && (
            <div
              className="absolute inset-y-0 w-0.5 bg-destructive/60"
              style={{ left: ganttOverlayLeft(todayPercent / 100) }}
            />
          )}
        </div>

        <div className="relative space-y-2">
          <GanttHeader months={months} />
          {groups.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              該当するプロジェクトはありません
            </p>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <GanttCategoryGroup key={group.key} label={group.label} items={group.items} />
              ))}
            </div>
          )}
        </div>
      </div>

      <GanttUnscheduledList projects={unscheduled} />
    </div>
  );
}
