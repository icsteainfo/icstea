import { z } from "zod";

export const intermediateRecipeInputSchema = z.object({
  name: z.string().trim().min(1, "レシピ名を入力してください").max(200),
  yield_amount: z.number().positive("出来上がり量を入力してください"),
  yield_unit: z.string().trim().min(1).max(20),
  note: z.string().trim().max(1000).nullable().optional(),
});
export type IntermediateRecipeFormInput = z.infer<
  typeof intermediateRecipeInputSchema
>;

export const intermediateRecipeIngredientInputSchema = z.object({
  product_id: z.string().uuid(),
  amount: z.number().positive("使用量を入力してください"),
  unit: z.string().trim().min(1).max(20),
});

export const intermediateRecipeSaveSchema = z.object({
  recipe: intermediateRecipeInputSchema,
  ingredients: z.array(intermediateRecipeIngredientInputSchema),
});
export type IntermediateRecipeSaveInput = z.infer<
  typeof intermediateRecipeSaveSchema
>;

export const menuItemInputSchema = z.object({
  name: z.string().trim().min(1, "商品名を入力してください").max(200),
  category: z.string().trim().max(100).nullable().optional(),
  parent_menu_item_id: z.string().uuid().nullable().optional(),
  hot_ice: z.enum(["HOT", "ICE"]).nullable().optional(),
  size: z.string().trim().max(20).nullable().optional(),
  variant_label: z.string().trim().max(100).nullable().optional(),
  list_price: z.number().min(0).nullable().optional(),
  recipe_category: z.string().trim().max(100).nullable().optional(),
});
export type MenuItemFormInput = z.infer<typeof menuItemInputSchema>;

export const menuItemIngredientInputSchema = z
  .object({
    ingredient_type: z.enum(["raw_material", "intermediate_recipe"]),
    product_id: z.string().uuid().nullable(),
    intermediate_recipe_id: z.string().uuid().nullable(),
    amount: z.number().positive("使用量を入力してください"),
    unit: z.string().trim().min(1).max(20),
  })
  .refine(
    (v) =>
      v.ingredient_type === "raw_material"
        ? v.product_id != null
        : v.intermediate_recipe_id != null,
    { message: "材料を選択してください" },
  );

export const menuItemSaveSchema = z.object({
  menuItem: menuItemInputSchema,
  // 省略された場合は材料明細を変更しない(商品名・カテゴリーだけを更新したい場合に使う)。
  ingredients: z.array(menuItemIngredientInputSchema).optional(),
});
export type MenuItemSaveInput = z.infer<typeof menuItemSaveSchema>;

export const recipeCategoryDefaultVariantInputSchema = z.object({
  hot_ice: z.enum(["HOT", "ICE"]).nullable(),
  size: z.string().trim().min(1, "サイズを入力してください").max(20),
  list_price: z.number().min(0).nullable(),
  cup_product_id: z.string().uuid().nullable(),
  lid_product_id: z.string().uuid().nullable(),
  straw_product_id: z.string().uuid().nullable(),
  sleeve_product_id: z.string().uuid().nullable(),
});
export type RecipeCategoryDefaultVariantFormInput = z.infer<
  typeof recipeCategoryDefaultVariantInputSchema
>;

export const recipeCategoryDefaultSaveSchema = z.object({
  variants: z.array(recipeCategoryDefaultVariantInputSchema),
});
export type RecipeCategoryDefaultSaveInput = z.infer<typeof recipeCategoryDefaultSaveSchema>;

export const applyCategoryDefaultsSchema = z.object({
  menuItemIds: z.array(z.string().uuid()).min(1, "反映する商品を選択してください"),
});
export type ApplyCategoryDefaultsInput = z.infer<typeof applyCategoryDefaultsSchema>;
