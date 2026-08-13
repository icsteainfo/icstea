import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type {
  TemplateSubtaskInput,
  TemplateSubtaskUpdateInput,
  TemplateUpdateInput,
} from "@/lib/validation/template";
import type {
  TaskTemplate,
  TaskTemplateSubtask,
  TaskTemplateWithRelations,
  TaskTemplateWithSubtasks,
} from "./types";

type Client = SupabaseClient<Database>;

const TEMPLATE_WITH_RELATIONS_SELECT = "*, categories(name)";

type TemplateRow = TaskTemplate & { categories: { name: string } | null };

function toTemplateWithRelations(row: TemplateRow): TaskTemplateWithRelations {
  const { categories, ...template } = row;
  return { ...template, category_name: categories?.name ?? null };
}

export async function listTemplates(
  supabase: Client,
): Promise<TaskTemplateWithRelations[]> {
  const { data, error } = await supabase
    .from("task_templates")
    .select(TEMPLATE_WITH_RELATIONS_SELECT)
    .order("sort_order");
  if (error) throw error;
  return (data as unknown as TemplateRow[]).map(toTemplateWithRelations);
}

export async function getTemplate(
  supabase: Client,
  id: string,
): Promise<TaskTemplateWithSubtasks | null> {
  const { data, error } = await supabase
    .from("task_templates")
    .select(TEMPLATE_WITH_RELATIONS_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const template = toTemplateWithRelations(data as unknown as TemplateRow);
  const subtasks = await listTemplateSubtasks(supabase, id);
  return { ...template, subtasks };
}

async function nextTemplateSortOrder(supabase: Client): Promise<number> {
  const { data, error } = await supabase
    .from("task_templates")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.sort_order ?? -1) + 1;
}

export async function createTemplate(
  supabase: Client,
  name: string,
): Promise<TaskTemplate> {
  const sort_order = await nextTemplateSortOrder(supabase);
  const { data, error } = await supabase
    .from("task_templates")
    .insert({ name, sort_order })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTemplate(
  supabase: Client,
  id: string,
  input: TemplateUpdateInput,
): Promise<TaskTemplate> {
  const patch: Database["public"]["Tables"]["task_templates"]["Update"] = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.category_id !== undefined) patch.category_id = input.category_id;

  const { data, error } = await supabase
    .from("task_templates")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTemplate(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("task_templates").delete().eq("id", id);
  if (error) throw error;
}

export async function listTemplateSubtasks(
  supabase: Client,
  templateId: string,
): Promise<TaskTemplateSubtask[]> {
  const { data, error } = await supabase
    .from("task_template_subtasks")
    .select("*")
    .eq("template_id", templateId)
    .order("sort_order");
  if (error) throw error;
  return data;
}

async function nextTemplateSubtaskSortOrder(
  supabase: Client,
  templateId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("task_template_subtasks")
    .select("sort_order")
    .eq("template_id", templateId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.sort_order ?? -1) + 1;
}

export async function createTemplateSubtask(
  supabase: Client,
  templateId: string,
  input: TemplateSubtaskInput,
): Promise<TaskTemplateSubtask> {
  const sort_order = await nextTemplateSubtaskSortOrder(supabase, templateId);
  const { data, error } = await supabase
    .from("task_template_subtasks")
    .insert({ template_id: templateId, title: input.title, sort_order })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTemplateSubtask(
  supabase: Client,
  id: string,
  input: TemplateSubtaskUpdateInput,
): Promise<TaskTemplateSubtask> {
  const { data, error } = await supabase
    .from("task_template_subtasks")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTemplateSubtask(
  supabase: Client,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("task_template_subtasks")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function reorderTemplateSubtasks(
  supabase: Client,
  templateId: string,
  orderedIds: string[],
): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("task_template_subtasks")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("template_id", templateId),
    ),
  );
}

// テンプレートから大項目タスクを作成し、登録済みのサブタスクをすべて複製する。
export async function createTaskFromTemplate(
  supabase: Client,
  templateId: string,
  title: string,
): Promise<{ id: string }> {
  const template = await getTemplate(supabase, templateId);
  if (!template) throw new Error("テンプレートが見つかりません");

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      title,
      category_id: template.category_id,
      assignee_type: "owner",
    })
    .select("id")
    .single();
  if (taskError) throw taskError;

  if (template.subtasks.length > 0) {
    const { error: subtasksError } = await supabase.from("subtasks").insert(
      template.subtasks.map((s) => ({
        task_id: task.id,
        title: s.title,
        sort_order: s.sort_order,
        assignee_type: "owner" as const,
      })),
    );
    if (subtasksError) throw subtasksError;
  }

  return { id: task.id };
}

// 既存タスク(大項目+サブタスク)からテンプレートを作成する。
// カテゴリー・サブタスクは引き継ぐが、期限・担当者・完了状態はテンプレートに持たせない
// (新規作成のたびに設定してもらう想定のため)。
export async function createTemplateFromTask(
  supabase: Client,
  taskId: string,
  templateName: string,
): Promise<TaskTemplate> {
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("category_id")
    .eq("id", taskId)
    .single();
  if (taskError) throw taskError;

  const { data: subtasks, error: subtasksError } = await supabase
    .from("subtasks")
    .select("title")
    .eq("task_id", taskId)
    .order("sort_order");
  if (subtasksError) throw subtasksError;

  const template = await createTemplate(supabase, templateName);
  await updateTemplate(supabase, template.id, { category_id: task.category_id });

  for (const subtask of subtasks) {
    await createTemplateSubtask(supabase, template.id, { title: subtask.title });
  }

  return { ...template, category_id: task.category_id };
}
