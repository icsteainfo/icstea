import { z } from "zod";

const taskFieldsSchema = z.object({
  title: z.string().trim().min(1, "タスク名を入力してください").max(200),
  memo: z.string().trim().max(2000).optional().nullable(),
  category_id: z.uuid().optional().nullable(),
  project_id: z.uuid().optional().nullable(),
  assignee_type: z.enum(["owner", "staff"]),
  assignee_staff_id: z.uuid().optional().nullable(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません")
    .optional()
    .nullable(),
  // 期間で登録する場合の開始日(空欄なら従来通り単発の期限のみのTodo)
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません")
    .optional()
    .nullable(),
  is_waiting: z.boolean().optional(),
  waiting_follow_up_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  waiting_note: z.string().trim().max(500).optional().nullable(),
  priority_level: z.enum(["urgent", "high", "medium", "low"]).optional(),
});

function requireStaffWhenAssigneeIsStaff(data: {
  assignee_type: "owner" | "staff";
  assignee_staff_id?: string | null;
}) {
  return data.assignee_type === "owner" || !!data.assignee_staff_id;
}

function isValidDateRange(data: { due_date?: string | null; start_date?: string | null }) {
  if (!data.start_date || !data.due_date) return true;
  return data.start_date <= data.due_date;
}

export const taskInputSchema = taskFieldsSchema
  .refine(requireStaffWhenAssigneeIsStaff, {
    message: "担当スタッフを選択してください",
    path: ["assignee_staff_id"],
  })
  .refine(isValidDateRange, {
    message: "開始日は期限と同じか、それより前の日にしてください",
    path: ["start_date"],
  });
export type TaskInput = z.infer<typeof taskInputSchema>;

export const taskUpdateSchema = taskFieldsSchema
  .partial()
  .refine(
    (data) =>
      data.assignee_type === undefined ||
      requireStaffWhenAssigneeIsStaff({
        assignee_type: data.assignee_type,
        assignee_staff_id: data.assignee_staff_id,
      }),
    {
      message: "担当スタッフを選択してください",
      path: ["assignee_staff_id"],
    },
  )
  .refine(isValidDateRange, {
    message: "開始日は期限と同じか、それより前の日にしてください",
    path: ["start_date"],
  });
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
