import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadCostingData } from "@/lib/costing/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function IntermediateRecipesPage() {
  const supabase = await createClient();
  const data = await loadCostingData(supabase);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          自家製シロップなど、複数の材料を配合してから商品に使うレシピです。
        </p>
        <Button render={<Link href="/costing/recipes/new">＋ 中間レシピを追加</Link>} />
      </div>

      <div className="space-y-2">
        {data.intermediateRecipes.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            中間レシピがまだ登録されていません。
          </p>
        )}
        {data.intermediateRecipes.map((recipe) => {
          const cost = data.intermediateRecipeUnitCostById.get(recipe.id) ?? null;
          return (
            <Link
              key={recipe.id}
              href={`/costing/recipes/${recipe.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3 hover:bg-muted/50"
            >
              <div className="space-y-1">
                <p className="font-medium">{recipe.name}</p>
                <Badge variant="outline">
                  出来上がり: {recipe.yield_amount}
                  {recipe.yield_unit}
                </Badge>
              </div>
              <div className="text-right">
                {cost != null ? (
                  <p className="font-semibold">
                    ¥{cost.toFixed(2)}
                    <span className="text-xs font-normal text-muted-foreground">
                      /{recipe.yield_unit}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">原価未計算</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
