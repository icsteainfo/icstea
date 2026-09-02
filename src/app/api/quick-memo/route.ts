import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateQuickMemo } from "@/lib/quick-memo/queries";

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const content = typeof body.content === "string" ? body.content : "";
  if (content.length > 4000) {
    return NextResponse.json({ error: "メモは4000文字以内で入力してください" }, { status: 400 });
  }

  const supabase = await createClient();
  await updateQuickMemo(supabase, content);
  return NextResponse.json({ ok: true });
}
