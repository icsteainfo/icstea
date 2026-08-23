import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { previewApplyCategoryDefaults } from "@/lib/costing/category-defaults-queries";
import { RECIPE_CATEGORIES } from "@/lib/costing/types";
import { ApplyCategoryDefaultsPanel } from "@/components/costing/apply-category-defaults-panel";

export default async function ApplyCategoryDefaultsPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);
  const known = RECIPE_CATEGORIES.find((c) => c.name === category);
  if (!known) notFound();

  const supabase = await createClient();
  const { data: menuItems, error } = await supabase
    .from("menu_items")
    .select("id, name")
    .eq("recipe_category", category)
    .is("parent_menu_item_id", null)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;

  const preview = await previewApplyCategoryDefaults(
    supabase,
    category,
    (menuItems ?? []) as { id: string; name: string }[],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h2 className="text-xl font-semibold">
          {known.emoji} {category} の初期設定を商品に反映
        </h2>
        <p className="text-sm text-muted-foreground">
          既に個別設定済みの項目は上書きしません。空欄の項目だけを補完し、まだ無いサイズ・HOT/ICEは新規に作成します。反映前に対象商品を確認・選択してください。
        </p>
      </div>
      {preview.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          このカテゴリーの商品がまだありません。
        </p>
      ) : (
        <ApplyCategoryDefaultsPanel category={category} preview={preview} />
      )}
    </div>
  );
}
