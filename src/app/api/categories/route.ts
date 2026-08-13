import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCategory, listCategories } from "@/lib/tasks/queries";
import { nameInputSchema } from "@/lib/validation/settings";

export async function GET() {
  const supabase = await createClient();
  const categories = await listCategories(supabase);
  return NextResponse.json({ categories });
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

  const category = await createCategory(supabase, parsed.data.name);
  return NextResponse.json({ category }, { status: 201 });
}
