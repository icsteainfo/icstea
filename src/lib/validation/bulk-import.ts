import { z } from "zod";

// --- AIの解析結果(構造化出力)のスキーマ ---

export const bulkImportSubtaskSchema = z.object({
  title: z.string(),
  completed: z.boolean(),
});

export const bulkImportCandidateSchema = z.object({
  title: z.string(),
  subtasks: z.array(bulkImportSubtaskSchema),
  categoryId: z.string().nullable(),
  dueDate: z.string().nullable(),
  assigneeStaffId: z.string().nullable(),
  priority: z.enum(["urgent", "high", "medium", "low"]),
  templateId: z.string().nullable(),
  duplicateTaskIds: z.array(z.string()),
});

export const bulkImportResponseSchema = z.object({
  candidates: z.array(bulkImportCandidateSchema),
});
export type BulkImportCandidate = z.infer<typeof bulkImportCandidateSchema>;

// --- 解析リクエスト(貼り付けたテキスト) ---

export const bulkImportParseRequestSchema = z.object({
  text: z.string().trim().min(1, "テキストを入力してください").max(20000),
});

// --- 解析リクエスト(アップロードした画像) ---

export const bulkImportParseImageRequestSchema = z.object({
  imageBase64: z
    .string()
    .min(1, "画像を選択してください")
    // 送信前にブラウザ側でリサイズ・圧縮している前提の上限(base64換算で約13MB)
    .max(18_000_000, "画像サイズが大きすぎます"),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

// --- 登録リクエスト(確認画面から正式登録) ---

export const bulkImportConfirmItemSchema = z
  .object({
    action: z.enum(["create", "attach"]),
    title: z.string().trim().min(1, "タイトルを入力してください").max(200),
    subtasks: z
      .array(
        z.object({
          title: z.string().trim().min(1).max(200),
          completed: z.boolean(),
        }),
      )
      .max(50),
    categoryId: z.uuid().nullable(),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    assigneeStaffId: z.uuid().nullable(),
    priority: z.enum(["urgent", "high", "medium", "low"]),
    targetExistingTaskId: z.uuid().nullable(),
  })
  .refine((data) => data.action !== "attach" || data.targetExistingTaskId !== null, {
    message: "追加先の既存タスクを選択してください",
    path: ["targetExistingTaskId"],
  });

export const bulkImportConfirmRequestSchema = z.object({
  items: z.array(bulkImportConfirmItemSchema).min(1).max(50),
});
