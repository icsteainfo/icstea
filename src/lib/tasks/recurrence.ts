import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, getLastDayOfMonth, getTodayDateString, getWeekday, makeDateString } from "@/lib/date";
import type { Database } from "@/types/database.types";
import type { RecurrenceConfig, RecurrenceSeries } from "./types";

type Client = SupabaseClient<Database>;

// 安全のためのループ上限(仮に設定ミスがあっても無限ループにならないように)
const MAX_ITERATIONS = 400;

export function computeNextOnOrAfter(
  series: Pick<RecurrenceSeries, "recurrence_type" | "recurrence_config">,
  fromDate: string,
): string {
  const config = (series.recurrence_config ?? {}) as RecurrenceConfig;

  switch (series.recurrence_type) {
    case "daily":
      return fromDate;

    case "weekly": {
      const targetWeekday = config.weekday ?? 0;
      const currentWeekday = getWeekday(fromDate);
      const diff = (targetWeekday - currentWeekday + 7) % 7;
      return addDays(fromDate, diff);
    }

    case "monthly_on_day": {
      const dayOfMonth = config.dayOfMonth ?? 1;
      const [y, m] = fromDate.split("-").map(Number);
      const candidate = makeDateString(y, m, dayOfMonth);
      if (candidate >= fromDate) return candidate;
      const nextMonth = m === 12 ? 1 : m + 1;
      const nextYear = m === 12 ? y + 1 : y;
      return makeDateString(nextYear, nextMonth, dayOfMonth);
    }

    case "monthly_last_day": {
      const [y, m] = fromDate.split("-").map(Number);
      const candidate = makeDateString(y, m, getLastDayOfMonth(y, m));
      if (candidate >= fromDate) return candidate;
      const nextMonth = m === 12 ? 1 : m + 1;
      const nextYear = m === 12 ? y + 1 : y;
      return makeDateString(nextYear, nextMonth, getLastDayOfMonth(nextYear, nextMonth));
    }
  }
}

function computeNextAfter(
  series: Pick<RecurrenceSeries, "recurrence_type" | "recurrence_config">,
  afterDate: string,
): string {
  return computeNextOnOrAfter(series, addDays(afterDate, 1));
}

// 未生成分をすべて生成する(idempotent: 何度呼んでも重複生成しない)。
// last_generated_due_date が未設定(登録直後)のシリーズは、初回の出現日が
// 今日より後でも、登録してすぐホームに表示できるようその1件だけ即時生成する。
export async function generateDueRecurringInstances(
  supabase: Client,
  today: string = getTodayDateString(),
): Promise<number> {
  const { data: seriesList, error } = await supabase
    .from("task_recurrence_series")
    .select("*")
    .eq("is_active", true);
  if (error) throw error;

  let generatedCount = 0;

  for (const series of seriesList ?? []) {
    const isNewSeries = series.last_generated_due_date === null;
    let cursor = series.last_generated_due_date
      ? computeNextAfter(series, series.last_generated_due_date)
      : computeNextOnOrAfter(series, series.created_at.slice(0, 10));

    // 生成すべき日がないシリーズがほとんどのため、その場合はサブタスク取得すら不要
    // (ホームを開くたびに全アクティブシリーズ分の問い合わせが走り、体感速度を悪化させていた)
    // ただし新規シリーズは、初回1件を必ず生成するためスキップしない
    if (!isNewSeries && cursor > today) continue;

    let iterations = 0;
    let lastGenerated: string | null = null;
    let generatedFirstOccurrence = false;

    // このシリーズに設定されたサブタスクのひな形(あれば、生成するTodoごとに複製する)
    const { data: seriesSubtasks, error: subtasksError } = await supabase
      .from("task_recurrence_series_subtasks")
      .select("title, sort_order")
      .eq("series_id", series.id)
      .order("sort_order");
    if (subtasksError) throw subtasksError;

    while (
      (cursor <= today || (isNewSeries && !generatedFirstOccurrence)) &&
      iterations < MAX_ITERATIONS
    ) {
      const dueDate = addDays(cursor, series.due_offset_days ?? 0);

      const { data: task, error: insertError } = await supabase
        .from("tasks")
        .insert({
          title: series.title_template,
          memo: series.memo_template,
          category_id: series.category_id,
          assignee_type: series.assignee_type,
          assignee_staff_id: series.assignee_staff_id,
          due_date: dueDate,
          priority_level: series.priority_level ?? "medium",
          recurrence_series_id: series.id,
          source: "manual",
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      if (seriesSubtasks && seriesSubtasks.length > 0) {
        const { error: cloneError } = await supabase.from("subtasks").insert(
          seriesSubtasks.map((s) => ({
            task_id: task.id,
            title: s.title,
            sort_order: s.sort_order,
            assignee_type: "owner" as const,
          })),
        );
        if (cloneError) throw cloneError;
      }

      generatedCount += 1;
      lastGenerated = cursor;
      generatedFirstOccurrence = true;
      cursor = computeNextAfter(series, cursor);
      iterations += 1;
    }

    if (lastGenerated) {
      const { error: updateError } = await supabase
        .from("task_recurrence_series")
        .update({ last_generated_due_date: lastGenerated })
        .eq("id", series.id);
      if (updateError) throw updateError;
    }
  }

  return generatedCount;
}
