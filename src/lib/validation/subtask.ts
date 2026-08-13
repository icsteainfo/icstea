import { z } from "zod";

const subtaskFieldsSchema = z.object({
  title: z.string().trim().min(1, "サブタスク名を入力してください").max(200),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません")
    .optional()
    .nullable(),
  assignee_type: z.enum(["owner", "staff"]),
  assignee_staff_id: z.uuid().optional().nullable(),
});

function requireStaffWhenAssigneeIsStaff(data: {
  assignee_type: "owner" | "staff";
  assignee_staff_id?: string | null;
}) {
  return data.assignee_type === "owner" || !!data.assignee_staff_id;
}

export const subtaskInputSchema = subtaskFieldsSchema.refine(
  requireStaffWhenAssigneeIsStaff,
  {
    message: "担当スタッフを選択してください",
    path: ["assignee_staff_id"],
  },
);
export type SubtaskInput = z.infer<typeof subtaskInputSchema>;

export const subtaskUpdateSchema = subtaskFieldsSchema.partial().refine(
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
);
export type SubtaskUpdateInput = z.infer<typeof subtaskUpdateSchema>;

export const progressOverrideSchema = z.object({
  value: z.number().int().min(0).max(100).nullable(),
});
