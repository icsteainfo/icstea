import { z } from "zod";

export const monthlyReviewCreateSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "月の形式が正しくありません"),
});
export type MonthlyReviewCreateInput = z.infer<typeof monthlyReviewCreateSchema>;

export const plLineItemInputSchema = z.object({
  label: z.string().trim().min(1, "項目名を入力してください").max(200),
  amount: z.number(),
  type: z.enum(["revenue", "expense", "reference"]),
});

export const monthlyReviewPlUpdateSchema = z.object({
  pl_image_storage_path: z.string().min(1).optional().nullable(),
  pl_image_file_name: z.string().min(1).max(300).optional().nullable(),
  pl_line_items: z.array(plLineItemInputSchema).max(100),
});
export type MonthlyReviewPlUpdateInput = z.infer<typeof monthlyReviewPlUpdateSchema>;

export const monthlyReviewNotesUpdateSchema = z.object({
  meeting_notes: z.string().trim().max(20000).optional().nullable(),
});
export type MonthlyReviewNotesUpdateInput = z.infer<typeof monthlyReviewNotesUpdateSchema>;

export const monthlyReviewParseImageRequestSchema = z.object({
  imageBase64: z
    .string()
    .min(1, "ファイルを選択してください")
    // 画像は送信前にブラウザ側でリサイズしているが、PDFはそのまま送るため上限を広めに取る
    .max(30_000_000, "ファイルサイズが大きすぎます"),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  month: z.string().regex(/^\d{4}-\d{2}$/, "月の形式が正しくありません"),
});
export type MonthlyReviewParseImageInput = z.infer<
  typeof monthlyReviewParseImageRequestSchema
>;
