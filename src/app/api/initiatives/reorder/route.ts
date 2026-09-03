import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reorderInitiatives } from "@/lib/initiatives/queries";
import { initiativeReorderSchema } from "@/lib/validation/initiative";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json().catch(() => ({}));
  const parsed = initiativeReorderSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "orderedIdsが必要です" }, { status: 400 });
  }

  await reorderInitiatives(supabase, parsed.data.orderedIds);
  return NextResponse.json({ ok: true });
}
