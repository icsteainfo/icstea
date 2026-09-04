import { addDays, formatMonthDayWeekday, getTodayDateString } from "@/lib/date";
import type { TaskWithRelations } from "./types";

export { getTodayDateString };

export function isOpen(task: TaskWithRelations): boolean {
  return task.status === "open";
}

export function isOverdue(
  task: TaskWithRelations,
  today: string = getTodayDateString(),
): boolean {
  return isOpen(task) && !task.is_waiting && !!task.due_date && task.due_date < today;
}

// 今日やること: 今日までにやるべきもの(期限超過分も含む)。対応待ちは除く。
// start_dateが設定されている(期間で登録された)Todoは、開始日から期限を過ぎるまでの間、毎日表示され続ける
export function isActionableToday(
  task: TaskWithRelations,
  today: string = getTodayDateString(),
): boolean {
  if (!isOpen(task) || task.is_waiting || !task.due_date) return false;
  const effectiveStart = task.start_date ?? task.due_date;
  return effectiveStart <= today;
}

// Phase 8でAIの優先順位付けに置き換えるまでの仮の並び替え:
// 期限超過を最優先、次に優先度、次に期限の近さ
const PRIORITY_ORDER: Record<TaskWithRelations["priority_level"], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function sortTasksFallback(
  tasks: TaskWithRelations[],
  today: string = getTodayDateString(),
): TaskWithRelations[] {
  return [...tasks].sort((a, b) => {
    const aOverdue = isOverdue(a, today) ? 0 : 1;
    const bOverdue = isOverdue(b, today) ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;

    const aPriority = PRIORITY_ORDER[a.priority_level];
    const bPriority = PRIORITY_ORDER[b.priority_level];
    if (aPriority !== bPriority) return aPriority - bPriority;

    if (a.due_date !== b.due_date) {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date < b.due_date ? -1 : 1;
    }

    return a.created_at < b.created_at ? -1 : 1;
  });
}

// カテゴリーごとにグループ化し、各カテゴリー内は優先度が高い順→期限が近い順(期限なしは最後)に並べる。
// カテゴリーの並び順は設定画面での並び順(sort_order)に従い、未分類は最後に表示する。
export function groupTasksByCategory(
  tasks: TaskWithRelations[],
  categories: { id: string; name: string }[],
): { categoryName: string; tasks: TaskWithRelations[] }[] {
  function sortByPriorityThenDueDate(list: TaskWithRelations[]): TaskWithRelations[] {
    return [...list].sort((a, b) => {
      const priorityDiff = PRIORITY_ORDER[a.priority_level] - PRIORITY_ORDER[b.priority_level];
      if (priorityDiff !== 0) return priorityDiff;

      if (a.due_date !== b.due_date) {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date < b.due_date ? -1 : 1;
      }

      return a.created_at < b.created_at ? -1 : 1;
    });
  }

  const byCategoryId = new Map<string | null, TaskWithRelations[]>();
  for (const task of tasks) {
    const key = task.category_id;
    const list = byCategoryId.get(key) ?? [];
    list.push(task);
    byCategoryId.set(key, list);
  }

  const groups: { categoryName: string; tasks: TaskWithRelations[] }[] = [];
  for (const category of categories) {
    const list = byCategoryId.get(category.id);
    if (list && list.length > 0) {
      groups.push({ categoryName: category.name, tasks: sortByPriorityThenDueDate(list) });
    }
  }
  const uncategorized = byCategoryId.get(null);
  if (uncategorized && uncategorized.length > 0) {
    groups.push({ categoryName: "未分類", tasks: sortByPriorityThenDueDate(uncategorized) });
  }
  return groups;
}

export type OtherTasksBucket = "undated" | "completed";

export function bucketOtherTasks(
  tasks: TaskWithRelations[],
  bucket: OtherTasksBucket,
): TaskWithRelations[] {
  if (bucket === "completed") {
    return tasks.filter((t) => t.status === "completed");
  }
  return tasks.filter((t) => isOpen(t) && !t.due_date);
}

export type TaskDateGroupKey = "overdue" | "today" | "tomorrow" | string;

export type TaskDateGroup = {
  key: TaskDateGroupKey;
  label: string;
  tasks: TaskWithRelations[];
};

// 期限が設定されているTodoを、Google Tasksのように「期限超過」「今日」「明日」
// 「9/9（水）」…という日付見出しごとにグループ化する(期限未定はここには含めない)。
// 期間タスク(start_date〜due_date)は、期限日が先でも進行中の間は「今日」に含める。
function taskDueGroupKey(
  task: TaskWithRelations,
  today: string,
  tomorrow: string,
): "overdue" | "today" | string | null {
  if (!task.due_date) return null;
  if (task.due_date < today) return "overdue";
  if (task.due_date === today) return "today";
  if (isActionableToday(task, today)) return "today";
  if (task.due_date === tomorrow) return "tomorrow";
  return task.due_date;
}

export function groupTasksByDueDate(
  tasks: TaskWithRelations[],
  today: string = getTodayDateString(),
): TaskDateGroup[] {
  const tomorrow = addDays(today, 1);
  const buckets = new Map<string, TaskWithRelations[]>();

  for (const task of tasks) {
    if (!isOpen(task)) continue;
    const key = taskDueGroupKey(task, today, tomorrow);
    if (key === null) continue; // 期限未定は別セクションで扱う
    const list = buckets.get(key) ?? [];
    list.push(task);
    buckets.set(key, list);
  }

  const groups: TaskDateGroup[] = [];

  const overdue = buckets.get("overdue");
  if (overdue) groups.push({ key: "overdue", label: "期限超過", tasks: sortTasksFallback(overdue, today) });

  const dueToday = buckets.get("today");
  if (dueToday) groups.push({ key: "today", label: "今日", tasks: sortTasksFallback(dueToday, today) });

  const dueTomorrow = buckets.get("tomorrow");
  if (dueTomorrow) groups.push({ key: "tomorrow", label: "明日", tasks: sortTasksFallback(dueTomorrow, today) });

  const futureDates = [...buckets.keys()]
    .filter((key) => key !== "overdue" && key !== "today" && key !== "tomorrow")
    .sort();
  for (const date of futureDates) {
    groups.push({ key: date, label: formatMonthDayWeekday(date), tasks: sortTasksFallback(buckets.get(date)!, today) });
  }

  return groups;
}
