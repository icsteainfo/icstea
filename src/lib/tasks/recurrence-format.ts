import type { RecurrenceConfig } from "./types";
import type { RecurrenceType } from "@/types/database.types";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function formatRecurrenceRule(
  type: RecurrenceType,
  config: RecurrenceConfig | null,
): string {
  switch (type) {
    case "daily":
      return "毎日";
    case "weekly":
      return `毎週${WEEKDAYS[config?.weekday ?? 0]}曜日`;
    case "monthly_on_day":
      return `毎月${config?.dayOfMonth ?? 1}日`;
    case "monthly_last_day":
      return "毎月月末";
  }
}

// 「毎月18日出現・5日後(23日)が期限」のように、出現日と期限の関係も含めて表示する。
export function formatRecurrenceRuleWithDueOffset(
  type: RecurrenceType,
  config: RecurrenceConfig | null,
  dueOffsetDays: number,
): string {
  const rule = formatRecurrenceRule(type, config);
  if (dueOffsetDays <= 0) return `${rule}に出現・当日が期限`;
  return `${rule}に出現・${dueOffsetDays}日後が期限`;
}
