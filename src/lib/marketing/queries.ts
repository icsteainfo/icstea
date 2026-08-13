import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { CampaignType, MarketingCampaign, MarketingCampaignWithMenuItem } from "./types";

type Client = SupabaseClient<Database>;

type CampaignRow = MarketingCampaign & {
  menu_items: { name: string } | null;
};

export async function listCampaigns(supabase: Client): Promise<MarketingCampaignWithMenuItem[]> {
  const { data, error } = await supabase
    .from("marketing_campaigns")
    .select("*, menu_items(name)")
    .order("date", { ascending: false });
  if (error) throw error;

  return (data as unknown as CampaignRow[]).map((row) => {
    const { menu_items, ...rest } = row;
    return { ...rest, menu_item_name: menu_items?.name ?? null };
  });
}

export async function createCampaign(
  supabase: Client,
  input: {
    type: CampaignType;
    date: string;
    menu_item_id: string | null;
    ad_cost: number | null;
    memo: string | null;
  },
): Promise<MarketingCampaign> {
  const { data, error } = await supabase
    .from("marketing_campaigns")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCampaign(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("marketing_campaigns").delete().eq("id", id);
  if (error) throw error;
}
