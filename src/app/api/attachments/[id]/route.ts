import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteAttachment, getAttachment } from "@/lib/attachments/queries";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const attachment = await getAttachment(supabase, id);
  if (!attachment) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }

  await deleteAttachment(supabase, attachment);
  return NextResponse.json({ ok: true });
}
