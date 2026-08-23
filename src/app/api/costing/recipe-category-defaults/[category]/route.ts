import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  deleteRecipeCategoryDefault,
  getRecipeCategoryDefault,
  saveRecipeCategoryDefault,
} from "@/lib/costing/category-defaults-queries";
import { recipeCategoryDefaultSaveSchema } from "@/lib/validation/costing";

type Params = { params: Promise<{ category: string }> };

function decodeCategory(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { category } = await params;
  const supabase = await createClient();
  const categoryDefault = await getRecipeCategoryDefault(supabase, decodeCategory(category));
  return NextResponse.json({ categoryDefault });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { category } = await params;
  const supabase = await createClient();
  const json = await request.json().catch(() => ({}));
  const parsed = recipeCategoryDefaultSaveSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  await saveRecipeCategoryDefault(supabase, decodeCategory(category), parsed.data.variants);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { category } = await params;
  const supabase = await createClient();
  await deleteRecipeCategoryDefault(supabase, decodeCategory(category));
  return NextResponse.json({ ok: true });
}
