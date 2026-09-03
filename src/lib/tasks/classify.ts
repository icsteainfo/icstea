import { getMonthRange, getTodayDateString, getWeekRange } from "@/lib/date";
import type { SubtaskWithRelations } from "@/lib/subtasks/types";
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

export function isDueToday(
  task: TaskWithRelations,
  today: string = getTodayDateString(),
): boolean {
  return isOpen(task) && !task.is_waiting && task.due_date === today;
}

// ⚠️要対応: 期限超過・本日期限・AIが緊急と判断したもの
export function isUrgent(
  task: TaskWithRelations,
  today: string = getTodayDateString(),
): boolean {
  if (!isOpen(task) || task.is_waiting) return false;
  return isOverdue(task, today) || isDueToday(task, today) || task.priority_level === "urgent";
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

export function isSubtaskActionableToday(
  subtask: SubtaskWithRelations,
  today: string = getTodayDateString(),
): boolean {
  return subtask.status === "open" && !!subtask.due_date && subtask.due_date <= today;
}

// ホーム画面「⚠️ 要対応」に表示する項目(大項目そのもの、またはサブタスク単位)。
// 「今日やること」は「要対応」と大きく重なるため統合しており、期限超過・本日期限・
// 優先度が緊急の大項目・期間中のTodoをまとめて対象にする(旧「今日やること」の範囲を含む)
export type TodayItem =
  | { kind: "task"; task: TaskWithRelations }
  | { kind: "subtask"; subtask: SubtaskWithRelations; parentTask: TaskWithRelations };

// 大項目が要対応(期限超過・本日期限・優先度緊急・期間中)でなくても、
// サブタスクの期限が今日までなら、そのサブタスクだけを混ぜて表示する
export function buildTodayItems(
  tasks: TaskWithRelations[],
  today: string = getTodayDateString(),
): TodayItem[] {
  const items: TodayItem[] = [];
  for (const task of tasks) {
    if (isUrgent(task, today) || isActionableToday(task, today)) {
      items.push({ kind: "task", task });
    }
    for (const subtask of task.subtasks) {
      if (isSubtaskActionableToday(subtask, today)) {
        items.push({ kind: "subtask", subtask, parentTask: task });
      }
    }
  }
  return sortTodayItems(items, today);
}

function todayItemDueDate(item: TodayItem): string | null {
  return item.kind === "task" ? item.task.due_date : item.subtask.due_date;
}

function todayItemPriorityRank(item: TodayItem): number {
  return item.kind === "task" ? PRIORITY_ORDER[item.task.priority_level] : PRIORITY_ORDER.medium;
}

function todayItemCreatedAt(item: TodayItem): string {
  return item.kind === "task" ? item.task.created_at : item.subtask.created_at;
}

// 期限切れ(期限超過)を最優先、次に優先度が高い順、次に期限が近い順(期限なしは最後)で並べる
export function sortTodayItems(
  items: TodayItem[],
  today: string = getTodayDateString(),
): TodayItem[] {
  return [...items].sort((a, b) => {
    const aDue = todayItemDueDate(a);
    const bDue = todayItemDueDate(b);
    const aOverdue = aDue && aDue < today ? 0 : 1;
    const bOverdue = bDue && bDue < today ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;

    const aPriority = todayItemPriorityRank(a);
    const bPriority = todayItemPriorityRank(b);
    if (aPriority !== bPriority) return aPriority - bPriority;

    if (aDue !== bDue) {
      if (!aDue) return 1;
      if (!bDue) return -1;
      return aDue < bDue ? -1 : 1;
    }

    return todayItemCreatedAt(a) < todayItemCreatedAt(b) ? -1 : 1;
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

export type OtherTasksBucket = "today" | "week" | "month" | "undated" | "completed";

export function bucketOtherTasks(
  tasks: TaskWithRelations[],
  bucket: OtherTasksBucket,
  today: string = getTodayDateString(),
): TaskWithRelations[] {
  if (bucket === "completed") {
    return tasks.filter((t) => t.status === "completed");
  }

  const openTasks = tasks.filter(isOpen);

  if (bucket === "undated") {
    return openTasks.filter((t) => !t.due_date);
  }
  if (bucket === "today") {
    return openTasks.filter((t) => t.due_date === today);
  }
  if (bucket === "week") {
    const { start, end } = getWeekRange(today);
    return openTasks.filter(
      (t) => t.due_date && t.due_date >= start && t.due_date <= end,
    );
  }
  // month
  const { start, end } = getMonthRange(today);
  return openTasks.filter(
    (t) => t.due_date && t.due_date >= start && t.due_date <= end,
  );
}
