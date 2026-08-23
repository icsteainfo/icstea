import { z } from "zod";

export const projectAttachmentInputSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("file"),
    project_id: z.uuid(),
    note_id: z.uuid().optional().nullable(),
    storage_path: z.string().min(1),
    file_name: z.string().min(1).max(300),
    mime_type: z.string().max(200).optional().nullable(),
    size_bytes: z.number().int().positive().optional().nullable(),
    label: z.string().max(200).optional().nullable(),
  }),
  z.object({
    kind: z.literal("url"),
    project_id: z.uuid(),
    note_id: z.uuid().optional().nullable(),
    external_url: z.url("正しいURLを入力してください"),
    label: z.string().max(200).optional().nullable(),
  }),
]);

export type ProjectAttachmentInput = z.infer<typeof projectAttachmentInputSchema>;
