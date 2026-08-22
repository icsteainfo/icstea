"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTodayDateString } from "@/lib/date";
import { GANTT_RANGE_LABELS, shiftAnchor, type GanttRange } from "@/lib/projects/gantt";

export function GanttRangeSwitcher({
  range,
  anchor,
}: {
  range: GanttRange;
  anchor: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(nextRange: GanttRange, nextAnchor: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", nextRange);
    params.set("anchor", nextAnchor);
    router.push(`/projects?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Tabs
        value={range}
        onValueChange={(v) => v && navigate(v as GanttRange, anchor)}
      >
        <TabsList>
          {(Object.keys(GANTT_RANGE_LABELS) as GanttRange[]).map((r) => (
            <TabsTrigger key={r} value={r}>
              {GANTT_RANGE_LABELS[r]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate(range, shiftAnchor(anchor, range, -1))}
        >
          ◀ 前へ
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate(range, getTodayDateString().slice(0, 8) + "01")}
        >
          今日
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate(range, shiftAnchor(anchor, range, 1))}
        >
          次へ ▶
        </Button>
      </div>
    </div>
  );
}
