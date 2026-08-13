import type { AttachmentKind } from "@/types/database.types";

export type Attachment = {
  id: string;
  task_id: string;
  kind: AttachmentKind;
  storage_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  external_url: string | null;
  label: string | null;
  created_at: string;
};
