import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteProjectAttachment, getProjectAttachment } from "@/lib/project-attachments/queries";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const attachment = await getProjectAttachment(supabase, id);
  if (!attachment) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }

  await deleteProjectAttachment(supabase, attachment);
  return NextResponse.json({ ok: true });
}
