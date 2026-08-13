import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reorderTemplateSubtasks } from "@/lib/templates/queries";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds : null;

  if (!orderedIds) {
    return NextResponse.json({ error: "orderedIdsが必要です" }, { status: 400 });
  }

  await reorderTemplateSubtasks(supabase, id, orderedIds);
  return NextResponse.json({ ok: true });
}
