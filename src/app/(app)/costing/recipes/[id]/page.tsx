import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getIntermediateRecipeWithIngredients } from "@/lib/costing/queries";
import { listProducts } from "@/lib/inventory/queries";
import { IntermediateRecipeForm } from "@/components/costing/intermediate-recipe-form";
import { CostingDeleteButton } from "@/components/costing/costing-delete-button";

export default async function EditIntermediateRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [recipe, products] = await Promise.all([
    getIntermediateRecipeWithIngredients(supabase, id),
    listProducts(supabase),
  ]);

  if (!recipe) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">中間レシピを編集</h2>
        <CostingDeleteButton
          apiPath={`/api/costing/recipes/${id}`}
          redirectTo="/costing/recipes"
          itemLabel="中間レシピ"
        />
      </div>
      <IntermediateRecipeForm mode="edit" recipe={recipe} products={products} />
    </div>
  );
}
