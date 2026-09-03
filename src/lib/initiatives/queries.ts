import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { InitiativeInput, InitiativeUpdateInput } from "@/lib/validation/initiative";
import { listTasksForInitiatives } from "@/lib/tasks/queries";
import type { Initiative, InitiativeListFilters, InitiativeWithTasks } from "./types";

type Client = SupabaseClient<Database>;

async function withTasks(
  supabase: Client,
  initiatives: Initiative[],
): Promise<InitiativeWithTasks[]> {
  const tasksByInitiative = await listTasksForInitiatives(
    supabase,
    initiatives.map((i) => i.id),
  );
  return initiatives.map((initiative) => ({
    ...initiative,
    tasks: tasksByInitiative.get(initiative.id) ?? [],
  }));
}

export async function listInitiatives(
  supabase: Client,
  filters: InitiativeListFilters = {},
): Promise<InitiativeWithTasks[]> {
  let query = supabase
    .from("initiatives")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (filters.archived !== undefined) query = query.eq("archived", filters.archived);

  const { data, error } = await query;
  if (error) throw error;

  return withTasks(supabase, data as Initiative[]);
}

export async function getInitiative(
  supabase: Client,
  id: string,
): Promise<InitiativeWithTasks | null> {
  const { data, error } = await supabase
    .from("initiatives")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const [withTasksResult] = await withTasks(supabase, [data as Initiative]);
  return withTasksResult;
}

async function nextSortOrder(supabase: Client): Promise<number> {
  const { data, error } = await supabase
    .from("initiatives")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.sort_order ?? -1) + 1;
}

export async function createInitiative(
  supabase: Client,
  input: InitiativeInput,
): Promise<Initiative> {
  const sort_order = await nextSortOrder(supabase);
  const { data, error } = await supabase
    .from("initiatives")
    .insert({
      title: input.title,
      priority: input.priority ?? "B",
      next_action: input.next_action || null,
      memo: input.memo || null,
      due_date: input.due_date || null,
      sort_order,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateInitiative(
  supabase: Client,
  id: string,
  input: InitiativeUpdateInput,
): Promise<Initiative> {
  const patch: Database["public"]["Tables"]["initiatives"]["Update"] = {};

  if (input.title !== undefined) patch.title = input.title;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.next_action !== undefined) patch.next_action = input.next_action || null;
  if (input.memo !== undefined) patch.memo = input.memo || null;
  if (input.due_date !== undefined) patch.due_date = input.due_date || null;
  if (input.archived !== undefined) patch.archived = input.archived;

  const { data, error } = await supabase
    .from("initiatives")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInitiative(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("initiatives").delete().eq("id", id);
  if (error) throw error;
}
