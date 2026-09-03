import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createInitiative, listInitiatives } from "@/lib/initiatives/queries";
import { initiativeInputSchema } from "@/lib/validation/initiative";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const params = request.nextUrl.searchParams;
  const archivedParam = params.get("archived");
  const archived = archivedParam === null ? undefined : archivedParam === "true";

  const initiatives = await listInitiatives(supabase, { archived });
  return NextResponse.json({ initiatives });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json();
  const parsed = initiativeInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const initiative = await createInitiative(supabase, parsed.data);
  return NextResponse.json({ initiative }, { status: 201 });
}
