import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { TaskInput, TaskUpdateInput } from "@/lib/validation/task";
import type {
  CreateRecurrenceSeriesFromTaskInput,
  RecurrenceSeriesInput,
} from "@/lib/validation/recurrence";
import { listSubtasks, listSubtasksForTasks } from "@/lib/subtasks/queries";
import { getTodayDateString } from "@/lib/date";
import { computeNextOnOrAfter } from "./recurrence";
import type {
  RecurrenceSeries,
  RecurrenceSeriesSubtask,
  RecurrenceSeriesWithRelations,
  RecurrenceSeriesWithSubtasks,
  Task,
  TaskListFilters,
  TaskWithRelations,
} from "./types";

type Client = SupabaseClient<Database>;

const TASK_WITH_RELATIONS_SELECT =
  "*, categories(name), staff!assignee_staff_id(name), projects(name)";

type TaskRow = Task & {
  categories: { name: string } | null;
  staff: { name: string } | null;
  projects: { name: string } | null;
};

function toTaskWithRelationsBase(
  row: TaskRow,
): Omit<TaskWithRelations, "subtasks"> {
  const { categories, staff, projects, ...task } = row;
  return {
    ...task,
    category_name: categories?.name ?? null,
    assignee_name: task.assignee_type === "owner" ? "自分" : (staff?.name ?? "-"),
    project_name: projects?.name ?? null,
  };
}

export async function listTasks(
  supabase: Client,
  filters: TaskListFilters = {},
): Promise<TaskWithRelations[]> {
  let query = supabase
    .from("tasks")
    .select(TASK_WITH_RELATIONS_SELECT)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.assigneeType)
    query = query.eq("assignee_type", filters.assigneeType);
  if (filters.assigneeStaffId)
    query = query.eq("assignee_staff_id", filters.assigneeStaffId);
  if (filters.isWaiting !== undefined)
    query = query.eq("is_waiting", filters.isWaiting);
  if (filters.projectId) query = query.eq("project_id", filters.projectId);

  const { data, error } = await query;
  if (error) throw error;

  const tasks = (data as unknown as TaskRow[]).map(toTaskWithRelationsBase);
  const subtasksByTask = await listSubtasksForTasks(
    supabase,
    tasks.map((t) => t.id),
  );
  return tasks.map((t) => ({ ...t, subtasks: subtasksByTask.get(t.id) ?? [] }));
}

// プロジェクト一覧・ホーム画面用に、複数プロジェクト分のTodoをまとめて取得する
export async function listTasksForProjects(
  supabase: Client,
  projectIds: string[],
): Promise<Map<string, TaskWithRelations[]>> {
  const byProject = new Map<string, TaskWithRelations[]>();
  if (projectIds.length === 0) return byProject;

  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_WITH_RELATIONS_SELECT)
    .in("project_id", projectIds)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  const tasks = (data as unknown as TaskRow[]).map(toTaskWithRelationsBase);
  const subtasksByTask = await listSubtasksForTasks(
    supabase,
    tasks.map((t) => t.id),
  );
  for (const t of tasks) {
    const withSubtasks = { ...t, subtasks: subtasksByTask.get(t.id) ?? [] };
    const list = byProject.get(t.project_id!) ?? [];
    list.push(withSubtasks);
    byProject.set(t.project_id!, list);
  }
  return byProject;
}

export async function getTask(
  supabase: Client,
  id: string,
): Promise<TaskWithRelations | null> {
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_WITH_RELATIONS_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const task = toTaskWithRelationsBase(data as unknown as TaskRow);
  const subtasks = await listSubtasks(supabase, id);
  return { ...task, subtasks };
}

export async function createTask(
  supabase: Client,
  input: TaskInput,
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: input.title,
      memo: input.memo || null,
      category_id: input.category_id || null,
      assignee_type: input.assignee_type,
      assignee_staff_id:
        input.assignee_type === "staff" ? input.assignee_staff_id : null,
      due_date: input.due_date || null,
      start_date: input.start_date || null,
      is_waiting: input.is_waiting ?? false,
      waiting_follow_up_date: input.waiting_follow_up_date || null,
      waiting_note: input.waiting_note || null,
      priority_level: input.priority_level ?? "medium",
      project_id: input.project_id || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(
  supabase: Client,
  id: string,
  input: TaskUpdateInput,
): Promise<Task> {
  const patch: Database["public"]["Tables"]["tasks"]["Update"] = {};

  if (input.title !== undefined) patch.title = input.title;
  if (input.memo !== undefined) patch.memo = input.memo || null;
  if (input.category_id !== undefined)
    patch.category_id = input.category_id || null;
  if (input.assignee_type !== undefined) {
    patch.assignee_type = input.assignee_type;
    patch.assignee_staff_id =
      input.assignee_type === "staff" ? input.assignee_staff_id || null : null;
  }
  if (input.due_date !== undefined) patch.due_date = input.due_date || null;
  if (input.start_date !== undefined) patch.start_date = input.start_date || null;
  if (input.is_waiting !== undefined) patch.is_waiting = input.is_waiting;
  if (input.waiting_follow_up_date !== undefined)
    patch.waiting_follow_up_date = input.waiting_follow_up_date || null;
  if (input.waiting_note !== undefined)
    patch.waiting_note = input.waiting_note || null;
  if (input.priority_level !== undefined)
    patch.priority_level = input.priority_level;
  if (input.project_id !== undefined)
    patch.project_id = input.project_id || null;

  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setTaskCompletion(
  supabase: Client,
  id: string,
  completed: boolean,
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: completed ? "completed" : "open",
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function listCategories(supabase: Client) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function listStaff(supabase: Client) {
  const { data, error } = await supabase
    .from("staff")
    .select("id, name, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data;
}

async function nextSortOrder(supabase: Client, table: "categories" | "staff") {
  const { data, error } = await supabase
    .from(table)
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.sort_order ?? 0) + 1;
}

export async function createCategory(supabase: Client, name: string) {
  const sort_order = await nextSortOrder(supabase, "categories");
  const { data, error } = await supabase
    .from("categories")
    .insert({ name, sort_order })
    .select("id, name, sort_order, is_active")
    .single();
  if (error) throw error;
  return data;
}

export async function renameCategory(
  supabase: Client,
  id: string,
  name: string,
) {
  const { data, error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", id)
    .select("id, name, sort_order, is_active")
    .single();
  if (error) throw error;
  return data;
}

export async function deactivateCategory(supabase: Client, id: string) {
  const { error } = await supabase
    .from("categories")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function createStaff(supabase: Client, name: string) {
  const sort_order = await nextSortOrder(supabase, "staff");
  const { data, error } = await supabase
    .from("staff")
    .insert({ name, sort_order })
    .select("id, name, sort_order, is_active")
    .single();
  if (error) throw error;
  return data;
}

export async function renameStaff(supabase: Client, id: string, name: string) {
  const { data, error } = await supabase
    .from("staff")
    .update({ name })
    .eq("id", id)
    .select("id, name, sort_order, is_active")
    .single();
  if (error) throw error;
  return data;
}

export async function deactivateStaff(supabase: Client, id: string) {
  const { error } = await supabase
    .from("staff")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function getStaffMember(supabase: Client, id: string) {
  const { data, error } = await supabase
    .from("staff")
    .select("id, name, sort_order, is_active")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

const SERIES_WITH_RELATIONS_SELECT =
  "*, categories(name), staff!assignee_staff_id(name)";

type SeriesRow = RecurrenceSeries & {
  categories: { name: string } | null;
  staff: { name: string } | null;
};

function toSeriesWithRelations(row: SeriesRow): RecurrenceSeriesWithRelations {
  const { categories, staff, ...series } = row;
  return {
    ...series,
    category_name: categories?.name ?? null,
    assignee_name:
      series.assignee_type === "owner" ? "自分" : (staff?.name ?? "-"),
  };
}

export async function createRecurrenceSeries(
  supabase: Client,
  input: RecurrenceSeriesInput,
): Promise<RecurrenceSeries> {
  const { data, error } = await supabase
    .from("task_recurrence_series")
    .insert({
      title_template: input.title,
      category_id: input.category_id || null,
      assignee_type: input.assignee_type,
      assignee_staff_id:
        input.assignee_type === "staff" ? input.assignee_staff_id : null,
      memo_template: input.memo || null,
      recurrence_type: input.recurrence_type,
      recurrence_config: input.recurrence_config ?? null,
      due_offset_days: input.due_offset_days ?? 0,
      priority_level: input.priority_level ?? "medium",
    })
    .select()
    .single();
  if (error) throw error;

  if (input.subtasks && input.subtasks.length > 0) {
    const { error: subtasksError } = await supabase
      .from("task_recurrence_series_subtasks")
      .insert(
        input.subtasks.map((s, index) => ({
          series_id: data.id,
          title: s.title,
          sort_order: index,
        })),
      );
    if (subtasksError) throw subtasksError;
  }

  return data;
}

// 既存のTodo(大項目+サブタスク)から繰り返しTodoシリーズを作成する。
// Todo名・カテゴリー・担当者・優先度・メモ・サブタスクは既存Todoからそのまま引き継ぐ。
// 今回分はこの既存Todoがすでにカバーしているとみなし、次回の自動生成が
// 今日分を重複して作らないよう last_generated_due_date を先回りして設定する。
export async function createRecurrenceSeriesFromTask(
  supabase: Client,
  taskId: string,
  input: CreateRecurrenceSeriesFromTaskInput,
): Promise<RecurrenceSeries> {
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("title, category_id, assignee_type, assignee_staff_id, priority_level, memo")
    .eq("id", taskId)
    .single();
  if (taskError) throw taskError;

  const { data: series, error } = await supabase
    .from("task_recurrence_series")
    .insert({
      title_template: task.title,
      category_id: task.category_id,
      assignee_type: task.assignee_type,
      assignee_staff_id: task.assignee_staff_id,
      memo_template: task.memo,
      priority_level: task.priority_level,
      recurrence_type: input.recurrence_type,
      recurrence_config: input.recurrence_config ?? null,
      due_offset_days: input.due_offset_days,
    })
    .select()
    .single();
  if (error) throw error;

  const subtasks = await listSubtasks(supabase, taskId);
  if (subtasks.length > 0) {
    const { error: subtasksError } = await supabase
      .from("task_recurrence_series_subtasks")
      .insert(
        subtasks.map((s, index) => ({
          series_id: series.id,
          title: s.title,
          sort_order: index,
        })),
      );
    if (subtasksError) throw subtasksError;
  }

  const nextTriggerDate = computeNextOnOrAfter(series, getTodayDateString());
  const { error: updateError } = await supabase
    .from("task_recurrence_series")
    .update({ last_generated_due_date: nextTriggerDate })
    .eq("id", series.id);
  if (updateError) throw updateError;

  const { error: linkError } = await supabase
    .from("tasks")
    .update({ recurrence_series_id: series.id })
    .eq("id", taskId);
  if (linkError) throw linkError;

  return { ...series, last_generated_due_date: nextTriggerDate };
}

export async function listRecurrenceSeriesSubtasks(
  supabase: Client,
  seriesId: string,
): Promise<RecurrenceSeriesSubtask[]> {
  const { data, error } = await supabase
    .from("task_recurrence_series_subtasks")
    .select("*")
    .eq("series_id", seriesId)
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function getRecurrenceSeries(
  supabase: Client,
  id: string,
): Promise<RecurrenceSeriesWithSubtasks | null> {
  const { data, error } = await supabase
    .from("task_recurrence_series")
    .select(SERIES_WITH_RELATIONS_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const subtasks = await listRecurrenceSeriesSubtasks(supabase, id);
  return { ...toSeriesWithRelations(data as unknown as SeriesRow), subtasks };
}

export async function updateRecurrenceSeries(
  supabase: Client,
  id: string,
  input: RecurrenceSeriesInput,
): Promise<RecurrenceSeries> {
  const { data, error } = await supabase
    .from("task_recurrence_series")
    .update({
      title_template: input.title,
      category_id: input.category_id || null,
      assignee_type: input.assignee_type,
      assignee_staff_id:
        input.assignee_type === "staff" ? input.assignee_staff_id : null,
      memo_template: input.memo || null,
      recurrence_type: input.recurrence_type,
      recurrence_config: input.recurrence_config ?? null,
      due_offset_days: input.due_offset_days ?? 0,
      priority_level: input.priority_level ?? "medium",
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  // サブタスクは一覧を丸ごと入れ替える(既存を削除して入力内容で作り直す)
  const { error: deleteError } = await supabase
    .from("task_recurrence_series_subtasks")
    .delete()
    .eq("series_id", id);
  if (deleteError) throw deleteError;

  if (input.subtasks && input.subtasks.length > 0) {
    const { error: subtasksError } = await supabase
      .from("task_recurrence_series_subtasks")
      .insert(
        input.subtasks.map((s, index) => ({
          series_id: id,
          title: s.title,
          sort_order: index,
        })),
      );
    if (subtasksError) throw subtasksError;
  }

  return data;
}

export async function listActiveRecurrenceSeries(
  supabase: Client,
): Promise<RecurrenceSeriesWithRelations[]> {
  const { data, error } = await supabase
    .from("task_recurrence_series")
    .select(SERIES_WITH_RELATIONS_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as SeriesRow[]).map(toSeriesWithRelations);
}

export async function deactivateRecurrenceSeries(
  supabase: Client,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("task_recurrence_series")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}
