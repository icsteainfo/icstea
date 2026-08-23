import type { Product } from "@/lib/inventory/types";
import type { MenuItem } from "@/lib/sales/types";
import type { IngredientType } from "@/types/database.types";

export type IntermediateRecipe = {
  id: string;
  name: string;
  yield_amount: number;
  yield_unit: string;
  note: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type IntermediateRecipeIngredient = {
  id: string;
  intermediate_recipe_id: string;
  product_id: string;
  amount: number;
  unit: string;
  sort_order: number;
};

export type IntermediateRecipeIngredientResolved = IntermediateRecipeIngredient & {
  product: Product | null;
};

export type IntermediateRecipeWithIngredients = IntermediateRecipe & {
  ingredients: IntermediateRecipeIngredientResolved[];
};

export type { IngredientType };

export type MenuItemIngredient = {
  id: string;
  menu_item_id: string;
  ingredient_type: IngredientType;
  product_id: string | null;
  intermediate_recipe_id: string | null;
  amount: number;
  unit: string;
  sort_order: number;
};

export type MenuItemIngredientResolved = MenuItemIngredient & {
  product: Product | null;
  intermediate_recipe: IntermediateRecipe | null;
};

export type MenuItemWithIngredients = MenuItem & {
  ingredients: MenuItemIngredientResolved[];
  parent: MenuItem | null;
  variants: MenuItem[];
};

// 原価計算の材料1行分(単価が確定していない材料があるとnull)。
export type CostLine = {
  amount: number;
  unitCost: number | null;
};

// 商品レシピ一覧の表示分類(固定8種)。売上分析が使うmenu_items.categoryとは別物なので、
// menu_items.recipe_categoryという専用の列に保存する。
export const RECIPE_CATEGORIES: { name: string; emoji: string }[] = [
  { name: "ストレート", emoji: "🍀" },
  { name: "ロイヤルミルクティー", emoji: "🫖" },
  { name: "スイートミルクティー", emoji: "🥛" },
  { name: "ティーソーダー", emoji: "🥤" },
  { name: "はちみつれもん", emoji: "🍯" },
  { name: "チャイ", emoji: "☕" },
  { name: "お酒(アルコール)", emoji: "🍸" },
  { name: "期間限定", emoji: "📅" },
  { name: "茶葉販売", emoji: "🌿" },
];
export const OTHER_RECIPE_CATEGORY = { name: "その他", emoji: "📦" };

// 原材料・資材一覧の表示分類(固定4種)。在庫ページが使うproducts.categoryとは別物なので、
// products.material_categoryという専用の列に保存する。
export const MATERIAL_CATEGORIES: { name: string; emoji: string }[] = [
  { name: "カップ・蓋・ストロー", emoji: "🥤" },
  { name: "茶葉", emoji: "🫖" },
  { name: "ミルク・割りもの", emoji: "🥛" },
  { name: "トッピング・その他", emoji: "🧋" },
];
export const OTHER_MATERIAL_CATEGORY = { name: "未分類", emoji: "❓" };

// ---------- カテゴリー初期設定(recipe_category_defaults) ----------

export type RecipeCategoryDefaultVariant = {
  id: string;
  category_default_id: string;
  hot_ice: "HOT" | "ICE" | null;
  size: string;
  list_price: number | null;
  cup_product_id: string | null;
  lid_product_id: string | null;
  straw_product_id: string | null;
  sleeve_product_id: string | null;
  sort_order: number;
};

export type RecipeCategoryDefault = {
  id: string;
  category: string;
  created_at: string;
  updated_at: string;
};

export type RecipeCategoryDefaultWithVariants = RecipeCategoryDefault & {
  variants: RecipeCategoryDefaultVariant[];
};

// ---------- 商品の使用状況(重複統合・削除の安全確認用) ----------

export type ProductUsageRef = { id: string; name: string };

export type ProductUsage = {
  menuItemIngredients: { count: number; refs: ProductUsageRef[] };
  intermediateRecipeIngredients: { count: number; refs: ProductUsageRef[] };
  categoryDefaultVariants: { count: number; refs: ProductUsageRef[] };
  stockSnapshots: number;
  inventoryCheckResults: number;
  tasks: number;
  priceHistory: number;
  isUnused: boolean;
};
