import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProjectPhase } from "@/types/database.types";
import type {
  ConvertTaskToProjectInput,
  ProjectInput,
  ProjectNoteInput,
  ProjectUpdateInput,
} from "@/lib/validation/project";
import { deleteTask, listTasks, listTasksForProjects } from "@/lib/tasks/queries";
import { listSubtasks } from "@/lib/subtasks/queries";
import type {
  Project,
  ProjectListFilters,
  ProjectNote,
  ProjectSummary,
  ProjectWithTasks,
} from "./types";

type Client = SupabaseClient<Database>;

const PROJECT_WITH_CATEGORY_SELECT = "*, categories(name)";

type ProjectRow = Project & { categories: { name: string } | null };

function toProjectBase(row: ProjectRow): Project & { category_name: string | null } {
  const { categories, ...project } = row;
  return { ...project, category_name: categories?.name ?? null };
}

export async function listProjects(
  supabase: Client,
  filters: ProjectListFilters = {},
): Promise<ProjectSummary[]> {
  let query = supabase
    .from("projects")
    .select(PROJECT_WITH_CATEGORY_SELECT)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (filters.phase) query = query.eq("phase", filters.phase);
  if (filters.excludePhases && filters.excludePhases.length > 0)
    query = query.not("phase", "in", `(${filters.excludePhases.join(",")})`);

  const { data, error } = await query;
  if (error) throw error;

  const projects = (data as unknown as ProjectRow[]).map(toProjectBase);
  const tasksByProject = await listTasksForProjects(
    supabase,
    projects.map((p) => p.id),
  );

  return projects.map((project) => ({
    ...project,
    tasks: tasksByProject.get(project.id) ?? [],
  }));
}

export async function getProject(
  supabase: Client,
  id: string,
): Promise<ProjectWithTasks | null> {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_WITH_CATEGORY_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const project = toProjectBase(data as unknown as ProjectRow);
  const [tasks, notes] = await Promise.all([
    listTasks(supabase, { projectId: id }),
    listProjectNotes(supabase, id),
  ]);
  return { ...project, tasks, notes };
}

export async function createProject(
  supabase: Client,
  input: ProjectInput,
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: input.name,
      category_id: input.category_id,
      purpose: input.purpose || null,
      memo: input.memo || null,
      phase: input.phase,
      start_date: input.start_date || null,
      due_date: input.due_date || null,
      end_date: input.end_date || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(
  supabase: Client,
  id: string,
  input: ProjectUpdateInput,
): Promise<Project> {
  const patch: Database["public"]["Tables"]["projects"]["Update"] = {};

  if (input.name !== undefined) patch.name = input.name;
  if (input.category_id !== undefined) patch.category_id = input.category_id;
  if (input.purpose !== undefined) patch.purpose = input.purpose || null;
  if (input.memo !== undefined) patch.memo = input.memo || null;
  if (input.start_date !== undefined)
    patch.start_date = input.start_date || null;
  if (input.due_date !== undefined) patch.due_date = input.due_date || null;
  if (input.end_date !== undefined) patch.end_date = input.end_date || null;
  if (input.final_review !== undefined)
    patch.final_review = input.final_review || null;

  if (input.phase !== undefined) {
    patch.phase = input.phase;
    // 完了に切り替わったタイミングで終了日が未設定なら、今日の日付を自動セットする
    if (input.phase === "completed" && input.end_date === undefined) {
      const { data: current } = await supabase
        .from("projects")
        .select("end_date")
        .eq("id", id)
        .maybeSingle();
      if (current && !current.end_date) {
        patch.end_date = new Date().toISOString().slice(0, 10);
      }
    }
  }

  const { data, error } = await supabase
    .from("projects")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setProjectPhase(
  supabase: Client,
  id: string,
  phase: ProjectPhase,
): Promise<Project> {
  const patch: Database["public"]["Tables"]["projects"]["Update"] = { phase };

  if (phase === "completed") {
    const { data: current } = await supabase
      .from("projects")
      .select("end_date")
      .eq("id", id)
      .maybeSingle();
    if (current && !current.end_date) {
      patch.end_date = new Date().toISOString().slice(0, 10);
    }
  }

  const { data, error } = await supabase
    .from("projects")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProject(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

// 既存Todo(大項目)をプロジェクトに変換する。
// Todo名 -> プロジェクト名、メモ -> 目的、カテゴリー・開始日/期限をそのまま引き継ぎ、
// サブタスクは(可能な範囲で)独立したTodoとしてプロジェクトに紐づけ直す。
// 元のTodoはプロジェクトへ生まれ変わったとみなして削除する(添付ファイルは引き継げないため失われる)。
export async function convertTaskToProject(
  supabase: Client,
  input: ConvertTaskToProjectInput,
): Promise<Project> {
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("title, memo, category_id, start_date, due_date, status")
    .eq("id", input.task_id)
    .single();
  if (taskError) throw taskError;

  const subtasks = await listSubtasks(supabase, input.task_id);

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: input.name?.trim() || task.title,
      category_id: task.category_id,
      purpose: task.memo,
      phase: task.status === "completed" ? "completed" : "active",
      start_date: task.start_date,
      due_date: task.due_date,
    })
    .select()
    .single();
  if (projectError) throw projectError;

  if (subtasks.length > 0) {
    const { error: tasksError } = await supabase.from("tasks").insert(
      subtasks.map((s) => ({
        title: s.title,
        category_id: task.category_id,
        project_id: project.id,
        assignee_type: s.assignee_type,
        assignee_staff_id: s.assignee_staff_id,
        due_date: s.due_date,
        status: s.status,
        completed_at: s.completed_at,
      })),
    );
    if (tasksError) throw tasksError;
  }

  await deleteTask(supabase, input.task_id);

  return project;
}

// 経過感想(随時追加できる進捗メモ)。新しいものが上に来るよう作成日時の降順で返す。
export async function listProjectNotes(
  supabase: Client,
  projectId: string,
): Promise<ProjectNote[]> {
  const { data, error } = await supabase
    .from("project_notes")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ProjectNote[];
}

export async function createProjectNote(
  supabase: Client,
  projectId: string,
  input: ProjectNoteInput,
): Promise<ProjectNote> {
  const { data, error } = await supabase
    .from("project_notes")
    .insert({
      project_id: projectId,
      note_type: input.note_type,
      content: input.content || null,
      diagram: input.note_type === "diagram" ? input.diagram : null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ProjectNote;
}

export async function deleteProjectNote(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("project_notes").delete().eq("id", id);
  if (error) throw error;
}
