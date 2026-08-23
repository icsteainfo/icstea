import type { AttachmentKind } from "@/types/database.types";

// note_idがあればその経過感想への添付、nullなら最終評価への添付
export type ProjectAttachment = {
  id: string;
  project_id: string;
  note_id: string | null;
  kind: AttachmentKind;
  storage_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  external_url: string | null;
  label: string | null;
  created_at: string;
};
