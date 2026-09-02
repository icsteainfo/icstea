import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

const QUICK_MEMO_ID = "singleton";

export async function getQuickMemo(supabase: Client): Promise<string> {
  const { data, error } = await supabase
    .from("quick_memo")
    .select("content")
    .eq("id", QUICK_MEMO_ID)
    .maybeSingle();
  if (error) throw error;
  return data?.content ?? "";
}

export async function updateQuickMemo(supabase: Client, content: string): Promise<void> {
  const { error } = await supabase
    .from("quick_memo")
    .upsert({ id: QUICK_MEMO_ID, content, updated_at: new Date().toISOString() });
  if (error) throw error;
}
