import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listProjects } from "@/lib/projects/queries";
import { listCategories } from "@/lib/tasks/queries";
import { getTodayDateString } from "@/lib/date";
import {
  computeBarPosition,
  computeTodayPercent,
  getVisibleMonths,
  getWindowRange,
  type GanttRange,
} from "@/lib/projects/gantt";
import { GanttChart, type GanttCategoryGroupData } from "@/components/projects/gantt/gantt-chart";
import { GanttRangeSwitcher } from "@/components/projects/gantt/gantt-range-switcher";
import { Button } from "@/components/ui/button";
import type { ProjectSummary } from "@/lib/projects/types";

const VALID_RANGES: GanttRange[] = ["month", "quarter", "half_year", "year"];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const range: GanttRange = VALID_RANGES.includes(params.range as GanttRange)
    ? (params.range as GanttRange)
    : "quarter";
  const today = getTodayDateString();
  const anchor = params.anchor && /^\d{4}-\d{2}-\d{2}$/.test(params.anchor)
    ? params.anchor
    : `${today.slice(0, 8)}01`;

  const [projects, categories] = await Promise.all([
    listProjects(supabase),
    listCategories(supabase),
  ]);

  const months = getVisibleMonths(anchor, range);
  const window = getWindowRange(anchor, range);
  const todayPercent = computeTodayPercent(today, window);

  const unscheduled: ProjectSummary[] = [];
  const visible: { project: ProjectSummary; bar: ReturnType<typeof computeBarPosition> }[] = [];

  for (const project of projects) {
    if (!project.start_date && !project.due_date && !project.end_date) {
      unscheduled.push(project);
      continue;
    }
    const bar = computeBarPosition(
      { startDate: project.start_date, dueDate: project.due_date, endDate: project.end_date },
      window,
    );
    if (bar) visible.push({ project, bar });
  }

  const groups: GanttCategoryGroupData[] = [];
  for (const category of categories) {
    const items = visible.filter((v) => v.project.category_id === category.id);
    if (items.length > 0) groups.push({ key: category.id, label: category.name, items });
  }
  const uncategorized = visible.filter((v) => !v.project.category_id);
  if (uncategorized.length > 0) {
    groups.push({ key: "uncategorized", label: "未分類", items: uncategorized });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">プロジェクト</h1>
        <Button render={<Link href="/projects/new">新規プロジェクト</Link>} />
      </div>

      <GanttRangeSwitcher range={range} anchor={anchor} />

      <GanttChart months={months} todayPercent={todayPercent} groups={groups} unscheduled={unscheduled} />
    </div>
  );
}
