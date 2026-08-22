import { z } from "zod";

const PROJECT_PHASES = [
  "concept",
  "researching",
  "preparing",
  "active",
  "operating",
  "on_hold",
  "completed",
] as const;

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません")
  .optional()
  .nullable();

const projectFieldsSchema = z.object({
  name: z.string().trim().min(1, "プロジェクト名を入力してください").max(200),
  category_id: z.uuid("カテゴリを選択してください"),
  phase: z.enum(PROJECT_PHASES),
  purpose: z.string().trim().max(2000).optional().nullable(),
  memo: z.string().trim().max(2000).optional().nullable(),
  start_date: dateField,
  due_date: dateField,
  end_date: dateField,
  final_review: z.string().trim().max(4000).optional().nullable(),
});

function isValidDateOrder(data: {
  start_date?: string | null;
  due_date?: string | null;
  end_date?: string | null;
}) {
  const { start_date, due_date, end_date } = data;
  if (start_date && due_date && start_date > due_date) return false;
  if (due_date && end_date && due_date > end_date) return false;
  if (start_date && end_date && start_date > end_date) return false;
  return true;
}

export const projectInputSchema = projectFieldsSchema.refine(isValidDateOrder, {
  message: "日付の前後関係を見直してください(開始日 ≦ 目標日 ≦ 終了日)",
  path: ["start_date"],
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

export const projectUpdateSchema = projectFieldsSchema.partial().refine(isValidDateOrder, {
  message: "日付の前後関係を見直してください(開始日 ≦ 目標日 ≦ 終了日)",
  path: ["start_date"],
});
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

export const convertTaskToProjectSchema = z.object({
  task_id: z.uuid(),
  name: z.string().trim().min(1, "プロジェクト名を入力してください").max(200).optional(),
});
export type ConvertTaskToProjectInput = z.infer<typeof convertTaskToProjectSchema>;

const diagramNodeSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().max(200),
  x: z.number(),
  y: z.number(),
});

const diagramEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().trim().max(100).optional().nullable(),
});

const diagramSchema = z.object({
  nodes: z.array(diagramNodeSchema).max(100),
  edges: z.array(diagramEdgeSchema).max(200),
});

export const projectNoteInputSchema = z.discriminatedUnion("note_type", [
  z.object({
    note_type: z.literal("text"),
    content: z.string().trim().min(1, "内容を入力してください").max(2000),
  }),
  z.object({
    note_type: z.literal("diagram"),
    content: z.string().trim().max(200).optional().nullable(),
    diagram: diagramSchema.refine((d) => d.nodes.length > 0, {
      message: "ノードを1つ以上追加してください",
    }),
  }),
]);
export type ProjectNoteInput = z.infer<typeof projectNoteInputSchema>;
