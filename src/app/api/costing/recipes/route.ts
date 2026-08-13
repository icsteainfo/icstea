import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createIntermediateRecipe,
  listIntermediateRecipes,
  replaceIntermediateRecipeIngredients,
} from "@/lib/costing/queries";
import { intermediateRecipeSaveSchema } from "@/lib/validation/costing";

export async function GET() {
  const supabase = await createClient();
  const recipes = await listIntermediateRecipes(supabase);
  return NextResponse.json({ recipes });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json();
  const parsed = intermediateRecipeSaveSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const recipe = await createIntermediateRecipe(supabase, parsed.data.recipe);
  await replaceIntermediateRecipeIngredients(
    supabase,
    recipe.id,
    parsed.data.ingredients,
  );
  return NextResponse.json({ recipe }, { status: 201 });
}
