import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Attachment } from "./types";

type Client = SupabaseClient<Database>;

export const ATTACHMENTS_BUCKET = "task-attachments";

export async function listAttachments(
  supabase: Client,
  taskId: string,
): Promise<Attachment[]> {
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createAttachment(
  supabase: Client,
  input: Omit<Attachment, "id" | "created_at">,
): Promise<Attachment> {
  const { data, error } = await supabase
    .from("attachments")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAttachment(
  supabase: Client,
  id: string,
): Promise<Attachment | null> {
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteAttachment(
  supabase: Client,
  attachment: Attachment,
): Promise<void> {
  if (attachment.kind === "file" && attachment.storage_path) {
    await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .remove([attachment.storage_path]);
  }
  const { error } = await supabase
    .from("attachments")
    .delete()
    .eq("id", attachment.id);
  if (error) throw error;
}
