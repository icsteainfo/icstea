import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setSalesTarget } from "@/lib/sales/queries";
import { z } from "zod";

const salesTargetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "月の形式が正しくありません"),
  target_amount: z.number().nonnegative(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json();
  const parsed = salesTargetSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  await setSalesTarget(supabase, parsed.data.month, parsed.data.target_amount);
  return NextResponse.json({ ok: true });
}
