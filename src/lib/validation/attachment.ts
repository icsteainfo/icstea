import { z } from "zod";

export const attachmentInputSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("file"),
    task_id: z.uuid(),
    storage_path: z.string().min(1),
    file_name: z.string().min(1).max(300),
    mime_type: z.string().max(200).optional().nullable(),
    size_bytes: z.number().int().positive().optional().nullable(),
    label: z.string().max(200).optional().nullable(),
  }),
  z.object({
    kind: z.literal("url"),
    task_id: z.uuid(),
    external_url: z.url("正しいURLを入力してください"),
    label: z.string().max(200).optional().nullable(),
  }),
]);

export type AttachmentInput = z.infer<typeof attachmentInputSchema>;
