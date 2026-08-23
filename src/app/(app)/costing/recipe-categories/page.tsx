import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listRecipeCategoryDefaults } from "@/lib/costing/category-defaults-queries";
import { RECIPE_CATEGORIES } from "@/lib/costing/types";
import { Badge } from "@/components/ui/badge";

export default async function RecipeCategoryDefaultsPage() {
  const supabase = await createClient();
  const defaults = await listRecipeCategoryDefaults(supabase);
  const defaultByCategory = new Map(defaults.map((d) => [d.category, d]));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        カテゴリーごとに、販売するサイズ・HOT/ICE区分・価格・カップ/蓋/ストロー/スリーブを初期設定しておくと、
        そのカテゴリーの新しい商品を開いたときに自動で入力されます。既存商品には、設定後に「このカテゴリーの商品に反映」で
        個別設定を上書きせずに反映できます。
      </p>
      <div className="space-y-2">
        {RECIPE_CATEGORIES.map((c) => {
          const def = defaultByCategory.get(c.name);
          const variantCount = def?.variants.length ?? 0;
          return (
            <Link
              key={c.name}
              href={`/costing/recipe-categories/${encodeURIComponent(c.name)}`}
              className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3 hover:bg-muted/50"
            >
              <span className="flex items-center gap-2 font-medium">
                <span aria-hidden>{c.emoji}</span>
                {c.name}
              </span>
              {variantCount > 0 ? (
                <Badge variant="secondary">{variantCount}種類を設定済み</Badge>
              ) : (
                <Badge variant="outline">未設定</Badge>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
