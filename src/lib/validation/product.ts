import { z } from "zod";

export const productInputSchema = z.object({
  name: z.string().trim().min(1, "商品名を入力してください").max(200),
  category: z.string().trim().min(1).max(100),
  unit: z.string().trim().min(1).max(20),
  lead_time_days: z.number().int().min(0).max(365),
  safety_stock: z.number().min(0),
  safety_stock_days: z.number().int().min(0).max(365),
  supplier: z.string().trim().max(200).nullable().optional(),
  purchase_price: z.number().min(0).nullable().optional(),
  package_amount: z.number().min(0).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
  material_category: z.string().trim().max(100).nullable().optional(),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const productUpdateSchema = productInputSchema.partial();
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export const productVisibilityBulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "商品を選択してください"),
  show_in_costing: z.boolean(),
});
export type ProductVisibilityBulkInput = z.infer<typeof productVisibilityBulkSchema>;

export const mergeProductSchema = z.object({
  targetProductId: z.string().uuid(),
});
export type MergeProductInput = z.infer<typeof mergeProductSchema>;
