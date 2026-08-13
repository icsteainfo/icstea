import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Product } from "@/lib/inventory/types";
import type { MenuItem } from "@/lib/sales/types";
import {
  intermediateRecipeUnitCost,
  sumIngredientCost,
  unitCost,
} from "./calculations";
import type {
  IntermediateRecipe,
  IntermediateRecipeIngredient,
  IntermediateRecipeWithIngredients,
  MenuItemIngredient,
  MenuItemWithIngredients,
  IngredientType,
} from "./types";

type Client = SupabaseClient<Database>;

export type IntermediateRecipeInput = {
  name: string;
  yield_amount: number;
  yield_unit: string;
  note?: string | null;
};

export type IngredientLineInput = {
  ingredient_type: IngredientType;
  product_id: string | null;
  intermediate_recipe_id: string | null;
  amount: number;
  unit: string;
};

export type MenuItemInput = {
  name: string;
  category?: string | null;
  parent_menu_item_id?: string | null;
  hot_ice?: "HOT" | "ICE" | null;
  size?: string | null;
  variant_label?: string | null;
  list_price?: number | null;
  recipe_category?: string | null;
};

// ---------- 中間レシピ ----------

export async function listIntermediateRecipes(
  supabase: Client,
): Promise<IntermediateRecipe[]> {
  const { data, error } = await supabase
    .from("intermediate_recipes")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data as unknown as IntermediateRecipe[];
}

export async function getIntermediateRecipeWithIngredients(
  supabase: Client,
  id: string,
): Promise<IntermediateRecipeWithIngredients | null> {
  const { data: recipe, error } = await supabase
    .from("intermediate_recipes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!recipe) return null;

  const { data: ingredients, error: ingError } = await supabase
    .from("intermediate_recipe_ingredients")
    .select("*, product:products(*)")
    .eq("intermediate_recipe_id", id)
    .order("sort_order");
  if (ingError) throw ingError;

  return {
    ...(recipe as unknown as IntermediateRecipe),
    ingredients: (ingredients ?? []) as unknown as (IntermediateRecipeIngredient & {
      product: Product | null;
    })[],
  };
}

export async function createIntermediateRecipe(
  supabase: Client,
  input: IntermediateRecipeInput,
): Promise<IntermediateRecipe> {
  const { data, error } = await supabase
    .from("intermediate_recipes")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as IntermediateRecipe;
}

export async function updateIntermediateRecipe(
  supabase: Client,
  id: string,
  input: Partial<IntermediateRecipeInput>,
): Promise<IntermediateRecipe> {
  const { data, error } = await supabase
    .from("intermediate_recipes")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as IntermediateRecipe;
}

export async function deactivateIntermediateRecipe(
  supabase: Client,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("intermediate_recipes")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}

// 材料明細をまるごと入れ替える(フォームで一括編集する想定のためシンプルなdelete→insert)。
export async function replaceIntermediateRecipeIngredients(
  supabase: Client,
  recipeId: string,
  ingredients: { product_id: string; amount: number; unit: string }[],
): Promise<void> {
  const { error: delError } = await supabase
    .from("intermediate_recipe_ingredients")
    .delete()
    .eq("intermediate_recipe_id", recipeId);
  if (delError) throw delError;

  if (ingredients.length === 0) return;

  const { error: insError } = await supabase
    .from("intermediate_recipe_ingredients")
    .insert(
      ingredients.map((ing, index) => ({
        intermediate_recipe_id: recipeId,
        product_id: ing.product_id,
        amount: ing.amount,
        unit: ing.unit,
        sort_order: index,
      })),
    );
  if (insError) throw insError;
}

// ---------- 商品レシピ(menu_items) ----------

export async function listMenuItemsForCosting(
  supabase: Client,
): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return data as unknown as MenuItem[];
}

export async function getMenuItemWithIngredients(
  supabase: Client,
  id: string,
): Promise<MenuItemWithIngredients | null> {
  const { data: menuItem, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!menuItem) return null;

  const [{ data: ingredients, error: ingError }, { data: variants, error: varError }, parentResult] =
    await Promise.all([
      supabase
        .from("menu_item_ingredients")
        .select("*, product:products(*), intermediate_recipe:intermediate_recipes(*)")
        .eq("menu_item_id", id)
        .order("sort_order"),
      supabase
        .from("menu_items")
        .select("*")
        .eq("parent_menu_item_id", id)
        .order("sort_order"),
      (menuItem as { parent_menu_item_id: string | null }).parent_menu_item_id
        ? supabase
            .from("menu_items")
            .select("*")
            .eq("id", (menuItem as { parent_menu_item_id: string }).parent_menu_item_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
  if (ingError) throw ingError;
  if (varError) throw varError;
  if (parentResult.error) throw parentResult.error;

  return {
    ...(menuItem as unknown as MenuItem),
    ingredients: (ingredients ?? []) as unknown as MenuItemWithIngredients["ingredients"],
    variants: (variants ?? []) as unknown as MenuItem[],
    parent: (parentResult.data as unknown as MenuItem | null) ?? null,
  };
}

// 商品(親)のバリエーション(子)を、材料明細つきでまとめて取得する。
// 「1画面で全バリエーションの原価入力欄を並べて表示する」ために使う。
export async function getVariantsWithIngredients(
  supabase: Client,
  parentId: string,
): Promise<(MenuItem & { ingredients: MenuItemWithIngredients["ingredients"] })[]> {
  const { data: variants, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("parent_menu_item_id", parentId)
    .order("sort_order");
  if (error) throw error;

  const variantList = (variants ?? []) as unknown as MenuItem[];
  if (variantList.length === 0) return [];

  const { data: ingredients, error: ingError } = await supabase
    .from("menu_item_ingredients")
    .select("*, product:products(*), intermediate_recipe:intermediate_recipes(*)")
    .in(
      "menu_item_id",
      variantList.map((v) => v.id),
    )
    .order("sort_order");
  if (ingError) throw ingError;

  const ingredientsByMenuItem = new Map<string, MenuItemWithIngredients["ingredients"]>();
  for (const ing of (ingredients ?? []) as unknown as MenuItemWithIngredients["ingredients"]) {
    const list = ingredientsByMenuItem.get(ing.menu_item_id) ?? [];
    list.push(ing);
    ingredientsByMenuItem.set(ing.menu_item_id, list);
  }

  return variantList.map((v) => ({
    ...v,
    ingredients: ingredientsByMenuItem.get(v.id) ?? [],
  }));
}

export async function createMenuItem(
  supabase: Client,
  input: MenuItemInput,
): Promise<MenuItem> {
  const { data, error } = await supabase
    .from("menu_items")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as MenuItem;
}

const STANDARD_VARIANT_COMBINATIONS: { hotIce: "HOT" | "ICE"; size: "S" | "M" | "L" }[] = [
  { hotIce: "HOT", size: "S" },
  { hotIce: "HOT", size: "M" },
  { hotIce: "HOT", size: "L" },
  { hotIce: "ICE", size: "S" },
  { hotIce: "ICE", size: "M" },
  { hotIce: "ICE", size: "L" },
];

// 新しい商品を作った時に、基本形であるHOT/ICE×S/M/Lの6バリエーションを
// あらかじめ作っておく(実際にはMサイズしかない等、不要なものは後から削除する想定)。
export async function createStandardVariants(
  supabase: Client,
  parentId: string,
  parentName: string,
): Promise<void> {
  const { error } = await supabase.from("menu_items").insert(
    STANDARD_VARIANT_COMBINATIONS.map(({ hotIce, size }) => ({
      name: `${parentName} ${hotIce} ${size}`,
      parent_menu_item_id: parentId,
      hot_ice: hotIce,
      size,
    })),
  );
  if (error) throw error;
}

export async function updateMenuItem(
  supabase: Client,
  id: string,
  input: Partial<MenuItemInput>,
): Promise<MenuItem> {
  const { data, error } = await supabase
    .from("menu_items")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as MenuItem;
}

export async function replaceMenuItemIngredients(
  supabase: Client,
  menuItemId: string,
  ingredients: IngredientLineInput[],
): Promise<void> {
  const { error: delError } = await supabase
    .from("menu_item_ingredients")
    .delete()
    .eq("menu_item_id", menuItemId);
  if (delError) throw delError;

  if (ingredients.length === 0) return;

  const { error: insError } = await supabase.from("menu_item_ingredients").insert(
    ingredients.map((ing, index) => ({
      menu_item_id: menuItemId,
      ingredient_type: ing.ingredient_type,
      product_id: ing.ingredient_type === "raw_material" ? ing.product_id : null,
      intermediate_recipe_id:
        ing.ingredient_type === "intermediate_recipe" ? ing.intermediate_recipe_id : null,
      amount: ing.amount,
      unit: ing.unit,
      sort_order: index,
    })),
  );
  if (insError) throw insError;
}

// 商品レシピ一覧で、カテゴリー内の商品を並び替えた時に呼ぶ。
export async function reorderMenuItems(
  supabase: Client,
  orderedIds: string[],
): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("menu_items").update({ sort_order: index }).eq("id", id),
    ),
  );
}

// ---------- 原価計算をまとめて行うためのデータ取得 ----------

export type CostingData = {
  productsById: Map<string, Product>;
  intermediateRecipes: IntermediateRecipe[];
  intermediateRecipeUnitCostById: Map<string, number | null>;
  menuItems: MenuItem[];
  menuItemIngredientsByMenuItem: Map<string, MenuItemIngredient[]>;
};

// 原材料・中間レシピ・商品レシピをまとめて読み込み、
// 中間レシピの1gあたり原価まで計算した状態で返す
// (商品一覧・原価分析ページの両方から使う共通データ取得)。
export async function loadCostingData(supabase: Client): Promise<CostingData> {
  const [{ data: products, error: prodError }, { data: recipes, error: recipeError }, {
    data: recipeIngredients,
    error: recipeIngError,
  }, { data: menuItems, error: menuError }, { data: menuIngredients, error: menuIngError }] =
    await Promise.all([
      supabase.from("products").select("*"),
      supabase.from("intermediate_recipes").select("*").eq("is_active", true),
      supabase.from("intermediate_recipe_ingredients").select("*"),
      supabase.from("menu_items").select("*").eq("is_active", true),
      supabase.from("menu_item_ingredients").select("*"),
    ]);
  if (prodError) throw prodError;
  if (recipeError) throw recipeError;
  if (recipeIngError) throw recipeIngError;
  if (menuError) throw menuError;
  if (menuIngError) throw menuIngError;

  const productsById = new Map<string, Product>();
  for (const p of (products ?? []) as unknown as Product[]) productsById.set(p.id, p);

  const recipeIngredientsByRecipe = new Map<string, IntermediateRecipeIngredient[]>();
  for (const ing of (recipeIngredients ?? []) as unknown as IntermediateRecipeIngredient[]) {
    const list = recipeIngredientsByRecipe.get(ing.intermediate_recipe_id) ?? [];
    list.push(ing);
    recipeIngredientsByRecipe.set(ing.intermediate_recipe_id, list);
  }

  const intermediateRecipes = (recipes ?? []) as unknown as IntermediateRecipe[];
  const intermediateRecipeUnitCostById = new Map<string, number | null>();
  for (const recipe of intermediateRecipes) {
    const ingredients = recipeIngredientsByRecipe.get(recipe.id) ?? [];
    const lines = ingredients.map((ing) => ({
      amount: ing.amount,
      unitCost: unitCost(productsById.get(ing.product_id) ?? { purchase_price: null, package_amount: null }),
    }));
    const totalCost = sumIngredientCost(lines);
    intermediateRecipeUnitCostById.set(recipe.id, intermediateRecipeUnitCost(totalCost, recipe.yield_amount));
  }

  const menuItemIngredientsByMenuItem = new Map<string, MenuItemIngredient[]>();
  for (const ing of (menuIngredients ?? []) as unknown as MenuItemIngredient[]) {
    const list = menuItemIngredientsByMenuItem.get(ing.menu_item_id) ?? [];
    list.push(ing);
    menuItemIngredientsByMenuItem.set(ing.menu_item_id, list);
  }

  return {
    productsById,
    intermediateRecipes,
    intermediateRecipeUnitCostById,
    menuItems: (menuItems ?? []) as unknown as MenuItem[],
    menuItemIngredientsByMenuItem,
  };
}

// 特定の商品(バリエーション)1つの原価を、読み込み済みのCostingDataから計算する。
export function computeMenuItemCost(
  menuItemId: string,
  data: Pick<CostingData, "productsById" | "intermediateRecipeUnitCostById" | "menuItemIngredientsByMenuItem">,
): number | null {
  const ingredients = data.menuItemIngredientsByMenuItem.get(menuItemId) ?? [];
  const lines = ingredients.map((ing) => {
    if (ing.ingredient_type === "raw_material") {
      const product = ing.product_id ? data.productsById.get(ing.product_id) : undefined;
      return {
        amount: ing.amount,
        unitCost: product ? unitCost(product) : null,
      };
    }
    const cost = ing.intermediate_recipe_id
      ? (data.intermediateRecipeUnitCostById.get(ing.intermediate_recipe_id) ?? null)
      : null;
    return { amount: ing.amount, unitCost: cost };
  });
  return sumIngredientCost(lines);
}
