"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RecurrenceType } from "@/types/database.types";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function RecurrenceEditor({
  recurrenceType,
  onRecurrenceTypeChange,
  weekday,
  onWeekdayChange,
  dayOfMonth,
  onDayOfMonthChange,
}: {
  recurrenceType: RecurrenceType;
  onRecurrenceTypeChange: (value: RecurrenceType) => void;
  weekday: number;
  onWeekdayChange: (value: number) => void;
  dayOfMonth: number;
  onDayOfMonthChange: (value: number) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="space-y-2">
        <Label>繰り返しの頻度</Label>
        <Select
          items={{
            daily: "毎日",
            weekly: "毎週",
            monthly_on_day: "毎月○日",
            monthly_last_day: "毎月月末",
          }}
          value={recurrenceType}
          onValueChange={(v: string | null) =>
            v && onRecurrenceTypeChange(v as RecurrenceType)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">毎日</SelectItem>
            <SelectItem value="weekly">毎週</SelectItem>
            <SelectItem value="monthly_on_day">毎月○日まで</SelectItem>
            <SelectItem value="monthly_last_day">毎月月末まで</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {recurrenceType === "weekly" && (
        <div className="space-y-2">
          <Label>曜日</Label>
          <Select
            items={Object.fromEntries(WEEKDAYS.map((label, i) => [String(i), `${label}曜日`]))}
            value={String(weekday)}
            onValueChange={(v: string | null) => v && onWeekdayChange(Number(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map((label, i) => (
                <SelectItem key={i} value={String(i)}>
                  {label}曜日
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {recurrenceType === "monthly_on_day" && (
        <div className="space-y-2">
          <Label htmlFor="day_of_month">毎月何日までか</Label>
          <Input
            id="day_of_month"
            type="number"
            min={1}
            max={31}
            value={dayOfMonth}
            onChange={(e) => onDayOfMonthChange(Number(e.target.value))}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        登録すると、今日までに発生すべき最初のタスクがすぐに作成されます。完了しても、次の周期になると自動的に新しいタスクが作成されます。
      </p>
    </div>
  );
}
