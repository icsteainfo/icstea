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
import type { RecurrenceConfig } from "@/lib/tasks/types";
import type { RecurrenceType } from "@/types/database.types";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export type RecurrenceRuleValue = {
  recurrenceType: RecurrenceType;
  weekday: number;
  dueWeekday: number;
  dayOfMonth: number;
  dueDayOfMonth: number;
  dueOffsetDays: number;
};

export const DEFAULT_RECURRENCE_RULE_VALUE: RecurrenceRuleValue = {
  recurrenceType: "monthly_on_day",
  weekday: 1,
  dueWeekday: 1,
  dayOfMonth: 1,
  dueDayOfMonth: 1,
  dueOffsetDays: 0,
};

// 画面で入力した「出現する日/曜日」「期限の日/曜日」から、内部で使う
// due_offset_days(出現してから何日後を期限にするか)を計算する
export function computeDueOffsetDays(value: RecurrenceRuleValue): number {
  if (value.recurrenceType === "weekly") {
    return (value.dueWeekday - value.weekday + 7) % 7;
  }
  if (value.recurrenceType === "monthly_on_day") {
    return Math.max(value.dueDayOfMonth - value.dayOfMonth, 0);
  }
  return value.dueOffsetDays;
}

// 保存済みのシリーズ(recurrence_type/recurrence_config/due_offset_days)から、
// 編集フォームの入力値(出現する日/曜日・期限の日/曜日)を復元する
export function deriveRecurrenceRuleValue(series: {
  recurrence_type: RecurrenceType;
  recurrence_config: RecurrenceConfig | null;
  due_offset_days: number;
}): RecurrenceRuleValue {
  const config = series.recurrence_config ?? {};
  const weekday = config.weekday ?? 1;
  const dayOfMonth = config.dayOfMonth ?? 1;

  return {
    recurrenceType: series.recurrence_type,
    weekday,
    dueWeekday: (weekday + series.due_offset_days) % 7,
    dayOfMonth,
    dueDayOfMonth: dayOfMonth + series.due_offset_days,
    dueOffsetDays: series.due_offset_days,
  };
}

// 月またぎ(例: 28日に出現・翌月3日が期限)には対応していないため、その場合だけ警告を出す
export function isRecurrenceRuleValid(value: RecurrenceRuleValue): boolean {
  if (value.recurrenceType === "monthly_on_day") {
    return value.dueDayOfMonth >= value.dayOfMonth;
  }
  return true;
}

export function RecurrenceRuleEditor({
  value,
  onChange,
}: {
  value: RecurrenceRuleValue;
  onChange: (next: RecurrenceRuleValue) => void;
}) {
  function set<K extends keyof RecurrenceRuleValue>(key: K, v: RecurrenceRuleValue[K]) {
    onChange({ ...value, [key]: v });
  }

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
          value={value.recurrenceType}
          onValueChange={(v: string | null) => v && set("recurrenceType", v as RecurrenceType)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">毎日</SelectItem>
            <SelectItem value="weekly">毎週</SelectItem>
            <SelectItem value="monthly_on_day">毎月○日</SelectItem>
            <SelectItem value="monthly_last_day">毎月月末</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {value.recurrenceType === "weekly" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Todoが出現する曜日</Label>
            <Select
              items={Object.fromEntries(WEEKDAYS.map((label, i) => [String(i), `${label}曜日`]))}
              value={String(value.weekday)}
              onValueChange={(v: string | null) => v && set("weekday", Number(v))}
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
          <div className="space-y-2">
            <Label>期限の曜日</Label>
            <Select
              items={Object.fromEntries(WEEKDAYS.map((label, i) => [String(i), `${label}曜日`]))}
              value={String(value.dueWeekday)}
              onValueChange={(v: string | null) => v && set("dueWeekday", Number(v))}
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
        </div>
      )}

      {value.recurrenceType === "monthly_on_day" && (
        <div className="space-y-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="day_of_month">Todoが出現する日</Label>
              <Input
                id="day_of_month"
                type="number"
                min={1}
                max={31}
                value={value.dayOfMonth}
                onChange={(e) => set("dayOfMonth", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_day_of_month">期限の日</Label>
              <Input
                id="due_day_of_month"
                type="number"
                min={1}
                max={31}
                value={value.dueDayOfMonth}
                onChange={(e) => set("dueDayOfMonth", Number(e.target.value))}
              />
            </div>
          </div>
          {!isRecurrenceRuleValid(value) && (
            <p className="text-xs text-destructive">
              期限の日は、出現する日と同じか後の日にしてください(月をまたぐ設定には対応していません)
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            例:毎月18日に出現・23日を期限にしたい場合は「出現する日=18」「期限の日=23」と入力してください。
          </p>
        </div>
      )}

      {(value.recurrenceType === "daily" || value.recurrenceType === "monthly_last_day") && (
        <div className="space-y-2">
          <Label htmlFor="due_offset">
            期限({value.recurrenceType === "daily" ? "出現した日" : "月末"}から何日後か)
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="due_offset"
              type="number"
              min={0}
              max={90}
              value={value.dueOffsetDays}
              onChange={(e) => set("dueOffsetDays", Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">
              日後(0にすると、出現した日がそのまま期限になります)
            </span>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        登録すると、今日までに発生すべき最初のTodoがすぐに作成されます。完了しても、次の周期になると自動的に新しいTodoが作成されます。
      </p>
    </div>
  );
}
