import { createClient } from "@/lib/supabase/server";
import { listProducts } from "@/lib/inventory/queries";
import { IntermediateRecipeForm } from "@/components/costing/intermediate-recipe-form";

export default async function NewIntermediateRecipePage() {
  const supabase = await createClient();
  const products = await listProducts(supabase);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-xl font-semibold">中間レシピを追加</h2>
      <IntermediateRecipeForm mode="create" products={products} />
    </div>
  );
}
