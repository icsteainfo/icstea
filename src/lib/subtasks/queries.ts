import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type {
  SubtaskInput,
  SubtaskUpdateInput,
} from "@/lib/validation/subtask";
import type { Subtask, SubtaskWithRelations } from "./types";

export { computeProgress } from "./progress";

type Client = SupabaseClient<Database>;

const SUBTASK_WITH_RELATIONS_SELECT = "*, staff!assignee_staff_id(name)";

type SubtaskRow = Subtask & { staff: { name: string } | null };

function toSubtaskWithRelations(row: SubtaskRow): SubtaskWithRelations {
  const { staff, ...subtask } = row;
  return {
    ...subtask,
    assignee_name: subtask.assignee_type === "owner" ? "自分" : (staff?.name ?? "-"),
  };
}

export async function listSubtasks(
  supabase: Client,
  taskId: string,
): Promise<SubtaskWithRelations[]> {
  const { data, error } = await supabase
    .from("subtasks")
    .select(SUBTASK_WITH_RELATIONS_SELECT)
    .eq("task_id", taskId)
    .order("sort_order");
  if (error) throw error;
  return (data as unknown as SubtaskRow[]).map(toSubtaskWithRelations);
}

// ホーム画面用に、複数タスク分のサブタスクをまとめて取得する
export async function listSubtasksForTasks(
  supabase: Client,
  taskIds: string[],
): Promise<Map<string, SubtaskWithRelations[]>> {
  const byTask = new Map<string, SubtaskWithRelations[]>();
  if (taskIds.length === 0) return byTask;

  const { data, error } = await supabase
    .from("subtasks")
    .select(SUBTASK_WITH_RELATIONS_SELECT)
    .in("task_id", taskIds)
    .order("sort_order");
  if (error) throw error;

  for (const row of data as unknown as SubtaskRow[]) {
    const subtask = toSubtaskWithRelations(row);
    const list = byTask.get(subtask.task_id) ?? [];
    list.push(subtask);
    byTask.set(subtask.task_id, list);
  }
  return byTask;
}

async function nextSortOrder(supabase: Client, taskId: string): Promise<number> {
  const { data, error } = await supabase
    .from("subtasks")
    .select("sort_order")
    .eq("task_id", taskId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.sort_order ?? -1) + 1;
}

// サブタスクを追加/完了/削除すると、大項目の手動進捗上書きは解除して自動計算に戻す
async function clearProgressOverride(supabase: Client, taskId: string): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({ progress_override: null })
    .eq("id", taskId);
  if (error) throw error;
}

export async function createSubtask(
  supabase: Client,
  taskId: string,
  input: SubtaskInput,
): Promise<Subtask> {
  const sort_order = await nextSortOrder(supabase, taskId);
  const { data, error } = await supabase
    .from("subtasks")
    .insert({
      task_id: taskId,
      title: input.title,
      due_date: input.due_date || null,
      assignee_type: input.assignee_type,
      assignee_staff_id:
        input.assignee_type === "staff" ? input.assignee_staff_id : null,
      sort_order,
    })
    .select()
    .single();
  if (error) throw error;
  await clearProgressOverride(supabase, taskId);
  return data;
}

export async function updateSubtask(
  supabase: Client,
  id: string,
  input: SubtaskUpdateInput,
): Promise<Subtask> {
  const patch: Database["public"]["Tables"]["subtasks"]["Update"] = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.due_date !== undefined) patch.due_date = input.due_date || null;
  if (input.assignee_type !== undefined) {
    patch.assignee_type = input.assignee_type;
    patch.assignee_staff_id =
      input.assignee_type === "staff" ? input.assignee_staff_id || null : null;
  }

  const { data, error } = await supabase
    .from("subtasks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSubtask(supabase: Client, id: string): Promise<void> {
  const { data: subtask, error: fetchError } = await supabase
    .from("subtasks")
    .select("task_id")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  const { error } = await supabase.from("subtasks").delete().eq("id", id);
  if (error) throw error;
  await clearProgressOverride(supabase, subtask.task_id);
}

export async function setSubtaskCompletion(
  supabase: Client,
  id: string,
  completed: boolean,
): Promise<Subtask> {
  const { data, error } = await supabase
    .from("subtasks")
    .update({
      status: completed ? "completed" : "open",
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  await clearProgressOverride(supabase, data.task_id);
  return data;
}

export async function reorderSubtasks(
  supabase: Client,
  taskId: string,
  orderedIds: string[],
): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("subtasks")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("task_id", taskId),
    ),
  );
}

export async function countOpenSubtasks(
  supabase: Client,
  taskId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("subtasks")
    .select("id", { count: "exact", head: true })
    .eq("task_id", taskId)
    .eq("status", "open");
  if (error) throw error;
  return count ?? 0;
}

export async function setTaskProgressOverride(
  supabase: Client,
  taskId: string,
  value: number | null,
): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({ progress_override: value })
    .eq("id", taskId);
  if (error) throw error;
}
