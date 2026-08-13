import { z } from "zod";

export const campaignInputSchema = z.object({
  type: z.enum([
    "instagram_post",
    "threads_post",
    "line_broadcast",
    "ad",
    "pop",
    "campaign",
    "collab",
    "new_product",
  ]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません"),
  menu_item_id: z.uuid().optional().nullable(),
  ad_cost: z.number().nonnegative().optional().nullable(),
  memo: z.string().trim().max(500).optional().nullable(),
});

export type CampaignInput = z.infer<typeof campaignInputSchema>;
