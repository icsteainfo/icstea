import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setTaskProgressOverride } from "@/lib/subtasks/queries";
import { progressOverrideSchema } from "@/lib/validation/subtask";

type Params = { params: Promise<{ id: string }> };

// 進捗率の手動上書き。value: null を送ると自動計算に戻す。
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json();
  const parsed = progressOverrideSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  await setTaskProgressOverride(supabase, id, parsed.data.value);
  return NextResponse.json({ ok: true });
}
