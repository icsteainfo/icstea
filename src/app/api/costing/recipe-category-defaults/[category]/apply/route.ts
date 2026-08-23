import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyCategoryDefaults } from "@/lib/costing/category-defaults-queries";
import { applyCategoryDefaultsSchema } from "@/lib/validation/costing";

type Params = { params: Promise<{ category: string }> };

function decodeCategory(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { category } = await params;
  const supabase = await createClient();
  const json = await request.json().catch(() => ({}));
  const parsed = applyCategoryDefaultsSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const { data: menuItems, error } = await supabase
    .from("menu_items")
    .select("id, name")
    .in("id", parsed.data.menuItemIds);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const result = await applyCategoryDefaults(
    supabase,
    decodeCategory(category),
    (menuItems ?? []) as { id: string; name: string }[],
  );
  return NextResponse.json({ ok: true, ...result });
}
