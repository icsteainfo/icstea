import { z } from "zod";

export const recurrenceSeriesInputSchema = z
  .object({
    title: z.string().trim().min(1, "タスク名を入力してください").max(200),
    memo: z.string().trim().max(2000).optional().nullable(),
    category_id: z.uuid().optional().nullable(),
    assignee_type: z.enum(["owner", "staff"]),
    assignee_staff_id: z.uuid().optional().nullable(),
    priority_level: z.enum(["urgent", "high", "medium", "low"]).optional(),
    recurrence_type: z.enum([
      "daily",
      "weekly",
      "monthly_on_day",
      "monthly_last_day",
    ]),
    recurrence_config: z
      .object({
        weekday: z.number().int().min(0).max(6).optional(),
        dayOfMonth: z.number().int().min(1).max(31).optional(),
      })
      .optional()
      .nullable(),
    // Todoが出現する日から何日後を期限にするか(0=出現日と同じ日)
    due_offset_days: z.number().int().min(0).max(90).optional(),
    subtasks: z
      .array(z.object({ title: z.string().trim().min(1).max(200) }))
      .max(50)
      .optional(),
  })
  .refine((data) => data.assignee_type === "owner" || !!data.assignee_staff_id, {
    message: "担当スタッフを選択してください",
    path: ["assignee_staff_id"],
  })
  .refine(
    (data) =>
      data.recurrence_type !== "weekly" ||
      data.recurrence_config?.weekday !== undefined,
    { message: "曜日を選択してください", path: ["recurrence_config"] },
  )
  .refine(
    (data) =>
      data.recurrence_type !== "monthly_on_day" ||
      data.recurrence_config?.dayOfMonth !== undefined,
    { message: "日を入力してください", path: ["recurrence_config"] },
  );

export type RecurrenceSeriesInput = z.infer<typeof recurrenceSeriesInputSchema>;

// 既存のTodoを繰り返しTodoに変換する際の入力(Todo名・カテゴリー・担当者・優先度・
// サブタスクは既存Todoからそのまま引き継ぐため、繰り返しルールのみを受け取る)
export const createRecurrenceSeriesFromTaskSchema = z
  .object({
    task_id: z.uuid(),
    recurrence_type: z.enum(["daily", "weekly", "monthly_on_day", "monthly_last_day"]),
    recurrence_config: z
      .object({
        weekday: z.number().int().min(0).max(6).optional(),
        dayOfMonth: z.number().int().min(1).max(31).optional(),
      })
      .optional()
      .nullable(),
    due_offset_days: z.number().int().min(0).max(90),
  })
  .refine(
    (data) =>
      data.recurrence_type !== "weekly" || data.recurrence_config?.weekday !== undefined,
    { message: "曜日を選択してください", path: ["recurrence_config"] },
  )
  .refine(
    (data) =>
      data.recurrence_type !== "monthly_on_day" ||
      data.recurrence_config?.dayOfMonth !== undefined,
    { message: "日を入力してください", path: ["recurrence_config"] },
  );

export type CreateRecurrenceSeriesFromTaskInput = z.infer<
  typeof createRecurrenceSeriesFromTaskSchema
>;
