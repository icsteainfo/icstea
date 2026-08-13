import type { CampaignType } from "@/types/database.types";
export type { CampaignType };

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  instagram_post: "Instagram投稿",
  threads_post: "Threads投稿",
  line_broadcast: "LINE配信",
  ad: "広告(Instagram広告等)",
  pop: "店頭POP掲示",
  campaign: "キャンペーン",
  collab: "コラボ",
  new_product: "新商品発売",
};

export type MarketingCampaign = {
  id: string;
  type: CampaignType;
  date: string;
  menu_item_id: string | null;
  ad_cost: number | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketingCampaignWithMenuItem = MarketingCampaign & {
  menu_item_name: string | null;
};
