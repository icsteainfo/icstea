import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listProducts } from "@/lib/inventory/queries";
import { getRecipeCategoryDefault } from "@/lib/costing/category-defaults-queries";
import { RECIPE_CATEGORIES } from "@/lib/costing/types";
import { RecipeCategoryDefaultForm } from "@/components/costing/recipe-category-default-form";
import { Button } from "@/components/ui/button";

export default async function RecipeCategoryDefaultPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);
  const known = RECIPE_CATEGORIES.find((c) => c.name === category);
  if (!known) notFound();

  const supabase = await createClient();
  const [categoryDefault, products, { count: menuItemCount }] = await Promise.all([
    getRecipeCategoryDefault(supabase, category),
    listProducts(supabase),
    supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("recipe_category", category)
      .is("parent_menu_item_id", null)
      .eq("is_active", true),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {known.emoji} {category} の初期設定
        </h2>
        {categoryDefault && categoryDefault.variants.length > 0 && (menuItemCount ?? 0) > 0 && (
          <Button
            variant="outline"
            size="sm"
            render={
              <Link href={`/costing/recipe-categories/${encodeURIComponent(category)}/apply`}>
                このカテゴリーの商品に反映({menuItemCount}件)
              </Link>
            }
          />
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        このカテゴリーが実際に販売するサイズ・HOT/ICEの組み合わせだけを追加してください(例:
        Mサイズしかない場合はSとLは追加不要です)。
      </p>
      <RecipeCategoryDefaultForm
        category={category}
        initialVariants={categoryDefault?.variants ?? []}
        products={products}
      />
    </div>
  );
}
