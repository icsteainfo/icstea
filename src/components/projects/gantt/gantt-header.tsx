import { monthLabel, yearLabelIfNeeded, type MonthBucket } from "@/lib/projects/gantt";

export function GanttHeader({ months }: { months: MonthBucket[] }) {
  return (
    <div className="flex text-xs text-muted-foreground">
      <div className="w-64 shrink-0" />
      <div className="flex flex-1">
        {months.map((m, i) => (
          <div key={i} className="flex-1 border-b border-border/60 pb-1.5 text-center">
            <div className="h-3 text-[10px] leading-3">
              {yearLabelIfNeeded(m, months[i - 1]) ?? ""}
            </div>
            <div className="font-medium text-foreground">{monthLabel(m)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
