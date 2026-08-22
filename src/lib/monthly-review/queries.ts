import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { ManagementPlan, MonthlyReview, PlLineItem } from "./types";

type Client = SupabaseClient<Database>;
type Row = Database["public"]["Tables"]["monthly_reviews"]["Row"];

export const MONTHLY_REVIEW_ATTACHMENTS_BUCKET = "monthly-review-attachments";

function mapRow(row: Row): MonthlyReview {
  return {
    ...row,
    pl_line_items: (row.pl_line_items ?? []) as unknown as PlLineItem[],
    ai_plan: (row.ai_plan ?? null) as unknown as ManagementPlan | null,
  };
}

export async function listMonthlyReviews(supabase: Client): Promise<MonthlyReview[]> {
  const { data, error } = await supabase
    .from("monthly_reviews")
    .select("*")
    .order("month", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(mapRow);
}

export async function getMonthlyReview(
  supabase: Client,
  id: string,
): Promise<MonthlyReview | null> {
  const { data, error } = await supabase
    .from("monthly_reviews")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as Row) : null;
}

export async function getMonthlyReviewByMonth(
  supabase: Client,
  month: string,
): Promise<MonthlyReview | null> {
  const { data, error } = await supabase
    .from("monthly_reviews")
    .select("*")
    .eq("month", month)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as Row) : null;
}

export async function createMonthlyReview(
  supabase: Client,
  month: string,
): Promise<MonthlyReview> {
  const { data, error } = await supabase
    .from("monthly_reviews")
    .insert({ month })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function updateMonthlyReviewPl(
  supabase: Client,
  id: string,
  input: {
    pl_image_storage_path: string | null;
    pl_image_file_name: string | null;
    pl_line_items: PlLineItem[];
  },
): Promise<MonthlyReview> {
  const { data, error } = await supabase
    .from("monthly_reviews")
    .update({
      pl_image_storage_path: input.pl_image_storage_path,
      pl_image_file_name: input.pl_image_file_name,
      pl_line_items: input.pl_line_items,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function updateMonthlyReviewNotes(
  supabase: Client,
  id: string,
  meetingNotes: string | null,
): Promise<MonthlyReview> {
  const { data, error } = await supabase
    .from("monthly_reviews")
    .update({ meeting_notes: meetingNotes })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function updateMonthlyReviewPlan(
  supabase: Client,
  id: string,
  plan: ManagementPlan,
): Promise<MonthlyReview> {
  const { data, error } = await supabase
    .from("monthly_reviews")
    .update({
      ai_plan: plan,
      ai_plan_generated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function deleteMonthlyReview(supabase: Client, id: string): Promise<void> {
  const review = await getMonthlyReview(supabase, id);
  if (review?.pl_image_storage_path) {
    await supabase.storage
      .from(MONTHLY_REVIEW_ATTACHMENTS_BUCKET)
      .remove([review.pl_image_storage_path]);
  }

  const { error } = await supabase.from("monthly_reviews").delete().eq("id", id);
  if (error) throw error;
}

// 経営プラン生成時、傾向を踏まえた提案ができるよう対象月より前の直近数か月分を参考として渡す
export async function listRecentMonthlyReviewsBefore(
  supabase: Client,
  month: string,
  limit: number,
): Promise<MonthlyReview[]> {
  const { data, error } = await supabase
    .from("monthly_reviews")
    .select("*")
    .lt("month", month)
    .order("month", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as Row[]).map(mapRow).reverse();
}
