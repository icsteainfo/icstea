"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { shiftPeriod, type Period, type PeriodRange } from "@/lib/sales/analysis";
import { getTodayDateString } from "@/lib/date";

const PERIOD_LABELS: Record<Period, string> = {
  daily: "日次",
  weekly: "週次",
  monthly: "月次",
};

function formatRangeLabel(period: Period, range: PeriodRange): string {
  if (period === "daily") return range.start;
  if (period === "monthly") return range.start.slice(0, 7);
  return `${range.start} 〜 ${range.end}`;
}

export function SalesPeriodTabs({
  period,
  date,
  range,
}: {
  period: Period;
  date: string;
  range: PeriodRange;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(nextPeriod: Period, nextDate: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", nextPeriod);
    params.set("date", nextDate);
    router.push(`/sales?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Tabs
        value={period}
        onValueChange={(v) => v && navigate(v as Period, date)}
      >
        <TabsList>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <TabsTrigger key={p} value={p}>
              {PERIOD_LABELS[p]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate(period, shiftPeriod(period, date, -1))}
        >
          ◀ 前へ
        </Button>
        <span className="min-w-32 text-center text-sm font-medium">
          {formatRangeLabel(period, range)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate(period, shiftPeriod(period, date, 1))}
        >
          次へ ▶
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate(period, getTodayDateString())}
        >
          今日
        </Button>
      </div>
    </div>
  );
}
