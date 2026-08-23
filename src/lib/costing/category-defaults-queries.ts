import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Product } from "@/lib/inventory/types";
import type {
  RecipeCategoryDefault,
  RecipeCategoryDefaultVariant,
  RecipeCategoryDefaultWithVariants,
} from "./types";

type Client = SupabaseClient<Database>;

// カップ・蓋・ストロー・スリーブは、原材料・資材ページの「カップ・蓋・ストロー」カテゴリーの中で
// 商品名にその語句が含まれるかどうかで役割を判定する(variant-recipe-editor.tsxの容器クイック選択と同じ考え方)。
const CONTAINER_MATERIAL_CATEGORY = "カップ・蓋・ストロー";
export const CONTAINER_ROLES = [
  { role: "cup", label: "カップ", keyword: "カップ" },
  { role: "lid", label: "蓋", keyword: "蓋" },
  { role: "straw", label: "ストロー", keyword: "ストロー" },
  { role: "sleeve", label: "スリーブ", keyword: "スリーブ" },
] as const;
export type ContainerRole = (typeof CONTAINER_ROLES)[number]["role"];

function roleLabel(role: ContainerRole): string {
  return CONTAINER_ROLES.find((r) => r.role === role)!.label;
}

function roleKeyword(role: ContainerRole): string {
  return CONTAINER_ROLES.find((r) => r.role === role)!.keyword;
}

function roleProductId(variant: RecipeCategoryDefaultVariant, role: ContainerRole): string | null {
  switch (role) {
    case "cup":
      return variant.cup_product_id;
    case "lid":
      return variant.lid_product_id;
    case "straw":
      return variant.straw_product_id;
    case "sleeve":
      return variant.sleeve_product_id;
  }
}

function isContainerCandidate(
  product: Pick<Product, "material_category" | "name">,
  role: ContainerRole,
): boolean {
  return (
    product.material_category === CONTAINER_MATERIAL_CATEGORY && product.name.includes(roleKeyword(role))
  );
}

export type RecipeCategoryDefaultVariantInput = {
  hot_ice: "HOT" | "ICE" | null;
  size: string;
  list_price: number | null;
  cup_product_id: string | null;
  lid_product_id: string | null;
  straw_product_id: string | null;
  sleeve_product_id: string | null;
};

export async function listRecipeCategoryDefaults(
  supabase: Client,
): Promise<RecipeCategoryDefaultWithVariants[]> {
  const [{ data: defaults, error }, { data: variants, error: varError }] = await Promise.all([
    supabase.from("recipe_category_defaults").select("*").order("category"),
    supabase.from("recipe_category_default_variants").select("*").order("sort_order"),
  ]);
  if (error) throw error;
  if (varError) throw varError;

  const variantsByDefault = new Map<string, RecipeCategoryDefaultVariant[]>();
  for (const v of (variants ?? []) as unknown as RecipeCategoryDefaultVariant[]) {
    const list = variantsByDefault.get(v.category_default_id) ?? [];
    list.push(v);
    variantsByDefault.set(v.category_default_id, list);
  }

  return ((defaults ?? []) as unknown as RecipeCategoryDefault[]).map((d) => ({
    ...d,
    variants: variantsByDefault.get(d.id) ?? [],
  }));
}

export async function getRecipeCategoryDefault(
  supabase: Client,
  category: string,
): Promise<RecipeCategoryDefaultWithVariants | null> {
  const { data: def, error } = await supabase
    .from("recipe_category_defaults")
    .select("*")
    .eq("category", category)
    .maybeSingle();
  if (error) throw error;
  if (!def) return null;

  const { data: variants, error: varError } = await supabase
    .from("recipe_category_default_variants")
    .select("*")
    .eq("category_default_id", (def as { id: string }).id)
    .order("sort_order");
  if (varError) throw varError;

  return {
    ...(def as unknown as RecipeCategoryDefault),
    variants: (variants ?? []) as unknown as RecipeCategoryDefaultVariant[],
  };
}

// カテゴリー初期設定を保存する(なければ作成)。バリエーション明細は、
// menu_item_ingredientsの保存と同じくシンプルなdelete→insertで丸ごと入れ替える
// (初期設定そのものの編集画面用。既存商品への「反映」はapplyCategoryDefaultsで別途行う)。
export async function saveRecipeCategoryDefault(
  supabase: Client,
  category: string,
  variants: RecipeCategoryDefaultVariantInput[],
): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from("recipe_category_defaults")
    .select("id")
    .eq("category", category)
    .maybeSingle();
  if (fetchError) throw fetchError;

  let categoryDefaultId = (existing as { id: string } | null)?.id;
  if (!categoryDefaultId) {
    const { data: created, error: insError } = await supabase
      .from("recipe_category_defaults")
      .insert({ category })
      .select("id")
      .single();
    if (insError) throw insError;
    categoryDefaultId = (created as { id: string }).id;
  }

  const { error: delError } = await supabase
    .from("recipe_category_default_variants")
    .delete()
    .eq("category_default_id", categoryDefaultId);
  if (delError) throw delError;

  if (variants.length === 0) return;

  const { error: insVarError } = await supabase.from("recipe_category_default_variants").insert(
    variants.map((v, index) => ({
      category_default_id: categoryDefaultId,
      hot_ice: v.hot_ice,
      size: v.size,
      list_price: v.list_price,
      cup_product_id: v.cup_product_id,
      lid_product_id: v.lid_product_id,
      straw_product_id: v.straw_product_id,
      sleeve_product_id: v.sleeve_product_id,
      sort_order: index,
    })),
  );
  if (insVarError) throw insVarError;
}

export async function deleteRecipeCategoryDefault(supabase: Client, category: string): Promise<void> {
  const { error } = await supabase.from("recipe_category_defaults").delete().eq("category", category);
  if (error) throw error;
}

// ---------- 既存商品への反映(非破壊) ----------

export type ApplySlotResult = {
  hot_ice: "HOT" | "ICE" | null;
  size: string;
  action: "create" | "update" | "skip";
  fills: string[];
};

export type ApplyPreviewItem = {
  menuItemId: string;
  menuItemName: string;
  slots: ApplySlotResult[];
};

type ChildVariant = {
  id: string;
  hot_ice: "HOT" | "ICE" | null;
  size: string | null;
  list_price: number | null;
  ingredients: { product_id: string | null; product: Product | null }[];
};

async function loadChildrenForItems(
  supabase: Client,
  menuItemIds: string[],
): Promise<Map<string, ChildVariant[]>> {
  if (menuItemIds.length === 0) return new Map();
  const { data: children, error } = await supabase
    .from("menu_items")
    .select("*")
    .in("parent_menu_item_id", menuItemIds);
  if (error) throw error;
  const childList = (children ?? []) as unknown as {
    id: string;
    parent_menu_item_id: string;
    hot_ice: "HOT" | "ICE" | null;
    size: string | null;
    list_price: number | null;
  }[];
  if (childList.length === 0) return new Map();

  const { data: ingredients, error: ingError } = await supabase
    .from("menu_item_ingredients")
    .select("*, product:products(*)")
    .in(
      "menu_item_id",
      childList.map((c) => c.id),
    );
  if (ingError) throw ingError;

  const ingredientsByChild = new Map<string, { product_id: string | null; product: Product | null }[]>();
  for (const ing of (ingredients ?? []) as unknown as {
    menu_item_id: string;
    product_id: string | null;
    product: Product | null;
  }[]) {
    const list = ingredientsByChild.get(ing.menu_item_id) ?? [];
    list.push({ product_id: ing.product_id, product: ing.product });
    ingredientsByChild.set(ing.menu_item_id, list);
  }

  const byParent = new Map<string, ChildVariant[]>();
  for (const c of childList) {
    const list = byParent.get(c.parent_menu_item_id) ?? [];
    list.push({ ...c, ingredients: ingredientsByChild.get(c.id) ?? [] });
    byParent.set(c.parent_menu_item_id, list);
  }
  return byParent;
}

function hasContainerRole(child: ChildVariant, role: ContainerRole): boolean {
  return child.ingredients.some((ing) => ing.product && isContainerCandidate(ing.product, role));
}

function computeSlotResult(
  variant: RecipeCategoryDefaultVariant,
  existing: ChildVariant | undefined,
): ApplySlotResult {
  if (!existing) {
    const fills = ["新規バリエーション"];
    if (variant.list_price != null) fills.push("販売価格");
    for (const { role } of CONTAINER_ROLES) {
      if (roleProductId(variant, role) != null) fills.push(roleLabel(role));
    }
    return { hot_ice: variant.hot_ice, size: variant.size, action: "create", fills };
  }

  const fills: string[] = [];
  if (existing.list_price == null && variant.list_price != null) fills.push("販売価格");
  for (const { role } of CONTAINER_ROLES) {
    if (roleProductId(variant, role) != null && !hasContainerRole(existing, role)) {
      fills.push(roleLabel(role));
    }
  }

  return {
    hot_ice: variant.hot_ice,
    size: variant.size,
    action: fills.length > 0 ? "update" : "skip",
    fills,
  };
}

// 「反映」の確認画面用。書き込みは行わず、何が新規作成/補完/変更なしになるかだけを計算する。
export async function previewApplyCategoryDefaults(
  supabase: Client,
  category: string,
  menuItems: { id: string; name: string }[],
): Promise<ApplyPreviewItem[]> {
  const categoryDefault = await getRecipeCategoryDefault(supabase, category);
  if (!categoryDefault || categoryDefault.variants.length === 0) return [];

  const childrenByParent = await loadChildrenForItems(
    supabase,
    menuItems.map((m) => m.id),
  );

  return menuItems.map((item) => {
    const children = childrenByParent.get(item.id) ?? [];
    const slots = categoryDefault.variants.map((v) => {
      const existing = children.find((c) => c.hot_ice === v.hot_ice && c.size === v.size);
      return computeSlotResult(v, existing);
    });
    return { menuItemId: item.id, menuItemName: item.name, slots };
  });
}

// 既に値が入っている項目(販売価格・カップ/蓋/ストロー/スリーブ)は上書きせず、
// 空欄だけを補完する。バリエーション自体が無いサイズ×HOT/ICEは新規作成する。
// 新規に群商品の初回バリエーションを自動生成する場合も(既存の子が0件なので)この関数で行う。
export async function applyCategoryDefaults(
  supabase: Client,
  category: string,
  menuItems: { id: string; name: string }[],
): Promise<{ created: number; updated: number }> {
  const categoryDefault = await getRecipeCategoryDefault(supabase, category);
  if (!categoryDefault || categoryDefault.variants.length === 0) return { created: 0, updated: 0 };

  const childrenByParent = await loadChildrenForItems(
    supabase,
    menuItems.map((m) => m.id),
  );

  const productIds = new Set<string>();
  for (const v of categoryDefault.variants) {
    for (const { role } of CONTAINER_ROLES) {
      const id = roleProductId(v, role);
      if (id) productIds.add(id);
    }
  }
  const productsById = new Map<string, Product>();
  if (productIds.size > 0) {
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .in("id", Array.from(productIds));
    if (error) throw error;
    for (const p of (products ?? []) as unknown as Product[]) productsById.set(p.id, p);
  }

  let created = 0;
  let updated = 0;

  for (const item of menuItems) {
    const children = childrenByParent.get(item.id) ?? [];
    for (const v of categoryDefault.variants) {
      const existing = children.find((c) => c.hot_ice === v.hot_ice && c.size === v.size);

      if (!existing) {
        const label = `${v.hot_ice ? `${v.hot_ice} ` : ""}${v.size}`;
        const { data: createdVariant, error } = await supabase
          .from("menu_items")
          .insert({
            name: `${item.name} ${label}`.trim(),
            parent_menu_item_id: item.id,
            hot_ice: v.hot_ice,
            size: v.size,
            list_price: v.list_price,
          })
          .select("id")
          .single();
        if (error) throw error;
        const newId = (createdVariant as { id: string }).id;

        const ingredientRows = CONTAINER_ROLES.map(({ role }, index) => {
          const productId = roleProductId(v, role);
          if (!productId) return null;
          const product = productsById.get(productId);
          return {
            menu_item_id: newId,
            ingredient_type: "raw_material" as const,
            product_id: productId,
            intermediate_recipe_id: null,
            amount: 1,
            unit: product?.unit ?? "個",
            sort_order: index,
          };
        }).filter((row): row is NonNullable<typeof row> => row !== null);

        if (ingredientRows.length > 0) {
          const { error: ingError } = await supabase.from("menu_item_ingredients").insert(ingredientRows);
          if (ingError) throw ingError;
        }
        created += 1;
        continue;
      }

      let didUpdate = false;

      if (existing.list_price == null && v.list_price != null) {
        const { error } = await supabase
          .from("menu_items")
          .update({ list_price: v.list_price })
          .eq("id", existing.id);
        if (error) throw error;
        didUpdate = true;
      }

      const missingRoles = CONTAINER_ROLES.filter(
        ({ role }) => roleProductId(v, role) != null && !hasContainerRole(existing, role),
      );
      if (missingRoles.length > 0) {
        const existingCount = existing.ingredients.length;
        const ingredientRows = missingRoles.map(({ role }, index) => {
          const productId = roleProductId(v, role)!;
          const product = productsById.get(productId);
          return {
            menu_item_id: existing.id,
            ingredient_type: "raw_material" as const,
            product_id: productId,
            intermediate_recipe_id: null,
            amount: 1,
            unit: product?.unit ?? "個",
            sort_order: existingCount + index,
          };
        });
        const { error: ingError } = await supabase.from("menu_item_ingredients").insert(ingredientRows);
        if (ingError) throw ingError;
        didUpdate = true;
      }

      if (didUpdate) updated += 1;
    }
  }

  return { created, updated };
}
