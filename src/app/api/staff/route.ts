import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createStaff, listStaff } from "@/lib/tasks/queries";
import { nameInputSchema } from "@/lib/validation/settings";

export async function GET() {
  const supabase = await createClient();
  const staff = await listStaff(supabase);
  return NextResponse.json({ staff });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json();
  const parsed = nameInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const staff = await createStaff(supabase, parsed.data.name);
  return NextResponse.json({ staff }, { status: 201 });
}
