import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { ProjectAttachment } from "./types";

type Client = SupabaseClient<Database>;

export const PROJECT_ATTACHMENTS_BUCKET = "project-attachments";

export async function listProjectAttachments(
  supabase: Client,
  projectId: string,
): Promise<ProjectAttachment[]> {
  const { data, error } = await supabase
    .from("project_attachments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createProjectAttachment(
  supabase: Client,
  input: Omit<ProjectAttachment, "id" | "created_at">,
): Promise<ProjectAttachment> {
  const { data, error } = await supabase
    .from("project_attachments")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getProjectAttachment(
  supabase: Client,
  id: string,
): Promise<ProjectAttachment | null> {
  const { data, error } = await supabase
    .from("project_attachments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteProjectAttachment(
  supabase: Client,
  attachment: ProjectAttachment,
): Promise<void> {
  if (attachment.kind === "file" && attachment.storage_path) {
    await supabase.storage
      .from(PROJECT_ATTACHMENTS_BUCKET)
      .remove([attachment.storage_path]);
  }
  const { error } = await supabase
    .from("project_attachments")
    .delete()
    .eq("id", attachment.id);
  if (error) throw error;
}
