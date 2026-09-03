import { z } from "zod";

const INITIATIVE_PRIORITIES = ["A", "B", "C", "D"] as const;

const initiativeFieldsSchema = z.object({
  title: z.string().trim().min(1, "取り組み名を入力してください").max(200),
  priority: z.enum(INITIATIVE_PRIORITIES).optional(),
  next_action: z.string().trim().max(2000).optional().nullable(),
  memo: z.string().trim().max(4000).optional().nullable(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません")
    .optional()
    .nullable(),
  archived: z.boolean().optional(),
});

export const initiativeInputSchema = initiativeFieldsSchema;
export type InitiativeInput = z.infer<typeof initiativeInputSchema>;

export const initiativeUpdateSchema = initiativeFieldsSchema.partial();
export type InitiativeUpdateInput = z.infer<typeof initiativeUpdateSchema>;
