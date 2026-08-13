import { z } from "zod";

export const templateInputSchema = z.object({
  name: z.string().trim().min(1, "テンプレート名を入力してください").max(100),
});
export type TemplateInput = z.infer<typeof templateInputSchema>;

export const templateUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  category_id: z.uuid().optional().nullable(),
});
export type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>;

export const templateSubtaskInputSchema = z.object({
  title: z.string().trim().min(1, "サブタスク名を入力してください").max(200),
});
export type TemplateSubtaskInput = z.infer<typeof templateSubtaskInputSchema>;

export const templateSubtaskUpdateSchema = templateSubtaskInputSchema.partial();
export type TemplateSubtaskUpdateInput = z.infer<
  typeof templateSubtaskUpdateSchema
>;

export const createTaskFromTemplateSchema = z.object({
  template_id: z.uuid(),
  title: z.string().trim().min(1, "タスク名を入力してください").max(200),
});
export type CreateTaskFromTemplateInput = z.infer<
  typeof createTaskFromTemplateSchema
>;

export const createTemplateFromTaskSchema = z.object({
  task_id: z.uuid(),
  name: z.string().trim().min(1, "テンプレート名を入力してください").max(100),
});
export type CreateTemplateFromTaskInput = z.infer<
  typeof createTemplateFromTaskSchema
>;
