import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  deactivateIntermediateRecipe,
  getIntermediateRecipeWithIngredients,
  replaceIntermediateRecipeIngredients,
  updateIntermediateRecipe,
} from "@/lib/costing/queries";
import { intermediateRecipeSaveSchema } from "@/lib/validation/costing";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const recipe = await getIntermediateRecipeWithIngredients(supabase, id);
  if (!recipe) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ recipe });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json();
  const parsed = intermediateRecipeSaveSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const recipe = await updateIntermediateRecipe(supabase, id, parsed.data.recipe);
  await replaceIntermediateRecipeIngredients(supabase, id, parsed.data.ingredients);
  return NextResponse.json({ recipe });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  await deactivateIntermediateRecipe(supabase, id);
  return NextResponse.json({ ok: true });
}
