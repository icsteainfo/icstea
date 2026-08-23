import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createProjectAttachment } from "@/lib/project-attachments/queries";
import { projectAttachmentInputSchema } from "@/lib/validation/project-attachment";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json();
  const parsed = projectAttachmentInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const attachment = await createProjectAttachment(supabase, {
    project_id: input.project_id,
    note_id: input.note_id ?? null,
    kind: input.kind,
    storage_path: input.kind === "file" ? input.storage_path : null,
    file_name: input.kind === "file" ? input.file_name : null,
    mime_type: input.kind === "file" ? (input.mime_type ?? null) : null,
    size_bytes: input.kind === "file" ? (input.size_bytes ?? null) : null,
    external_url: input.kind === "url" ? input.external_url : null,
    label: input.label ?? null,
  });

  return NextResponse.json({ attachment }, { status: 201 });
}
