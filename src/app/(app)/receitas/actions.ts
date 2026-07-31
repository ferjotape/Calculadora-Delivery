"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  recipeSchema,
  recipeDetailsSchema,
  recipeIngredientSchema,
  type RecipeInput,
  type RecipeDetailsInput,
  type RecipeIngredientInput,
} from "@/lib/validation/recipe";
import {
  applyDiscount,
  computePlatformPrice,
  computePriceMetrics,
  computeRecipePricing,
} from "@/lib/pricing";
import type { Recipe, RecipeIngredient } from "@/lib/types/database";

export type RecipeActionResult = {
  success: boolean;
  error?: string;
  recipe?: Recipe;
};

export type RecipeIngredientActionResult = {
  success: boolean;
  error?: string;
  recipeIngredient?: RecipeIngredient;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Confirma que a receita pertence ao usuário (defesa em profundidade além da RLS). */
async function requireOwnedRecipe(
  supabase: Awaited<ReturnType<typeof createClient>>,
  recipeId: string,
  userId: string
) {
  const { data } = await supabase
    .from("recipes")
    .select("id")
    .eq("id", recipeId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function createRecipe(input: RecipeInput): Promise<RecipeActionResult> {
  const parsed = recipeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Revise os campos e tente novamente." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      loss_pct: parsed.data.loss_pct,
    })
    .select("*")
    .single();

  if (error) {
    return { success: false, error: "Não foi possível criar a receita." };
  }

  revalidatePath("/receitas");
  return { success: true, recipe: data };
}

export async function updateRecipe(
  id: string,
  input: RecipeDetailsInput
): Promise<RecipeActionResult> {
  const parsed = recipeDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Revise os campos e tente novamente." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { data, error } = await supabase
    .from("recipes")
    .update({
      name: parsed.data.name,
      loss_pct: parsed.data.loss_pct,
      discount_pct: parsed.data.discount_pct,
      practiced_price: parsed.data.practiced_price,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: "Não foi possível salvar a receita." };
  }

  revalidatePath("/receitas");
  revalidatePath(`/receitas/${id}`);
  return { success: true, recipe: data };
}

export async function deleteRecipe(id: string): Promise<RecipeActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { error } = await supabase.from("recipes").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return { success: false, error: "Não foi possível remover a receita." };
  }

  revalidatePath("/receitas");
  return { success: true };
}

export async function addRecipeIngredient(
  recipeId: string,
  input: RecipeIngredientInput
): Promise<RecipeIngredientActionResult> {
  const parsed = recipeIngredientSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Selecione um insumo e informe a quantidade." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  if (!(await requireOwnedRecipe(supabase, recipeId, user.id))) {
    return { success: false, error: "Receita não encontrada." };
  }

  const { data, error } = await supabase
    .from("recipe_ingredients")
    .insert({
      recipe_id: recipeId,
      ingredient_id: parsed.data.ingredient_id,
      quantity_used: parsed.data.quantity_used,
    })
    .select("*")
    .single();

  if (error) {
    return { success: false, error: "Não foi possível adicionar o insumo à receita." };
  }

  revalidatePath(`/receitas/${recipeId}`);
  revalidatePath("/receitas");
  return { success: true, recipeIngredient: data };
}

export async function updateRecipeIngredient(
  id: string,
  recipeId: string,
  input: RecipeIngredientInput
): Promise<RecipeIngredientActionResult> {
  const parsed = recipeIngredientSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Selecione um insumo e informe a quantidade." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  if (!(await requireOwnedRecipe(supabase, recipeId, user.id))) {
    return { success: false, error: "Receita não encontrada." };
  }

  const { data, error } = await supabase
    .from("recipe_ingredients")
    .update({
      ingredient_id: parsed.data.ingredient_id,
      quantity_used: parsed.data.quantity_used,
    })
    .eq("id", id)
    .eq("recipe_id", recipeId)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: "Não foi possível salvar o insumo da receita." };
  }

  revalidatePath(`/receitas/${recipeId}`);
  revalidatePath("/receitas");
  return { success: true, recipeIngredient: data };
}

export async function removeRecipeIngredient(
  id: string,
  recipeId: string
): Promise<RecipeIngredientActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  if (!(await requireOwnedRecipe(supabase, recipeId, user.id))) {
    return { success: false, error: "Receita não encontrada." };
  }

  const { error } = await supabase
    .from("recipe_ingredients")
    .delete()
    .eq("id", id)
    .eq("recipe_id", recipeId);

  if (error) {
    return { success: false, error: "Não foi possível remover o insumo da receita." };
  }

  revalidatePath(`/receitas/${recipeId}`);
  revalidatePath("/receitas");
  return { success: true };
}

export type SyncRecipePlatformPricesResult = {
  success: boolean;
  error?: string;
};

/**
 * Recalcula preço sugerido, preço com desconto, lucro e CMV para cada plataforma
 * ativa do usuário e grava um novo snapshot em recipe_platform_prices (histórico/cache).
 * Sempre relê o estado atual do banco, então é seguro chamar ao abrir a receita ou
 * depois de qualquer alteração já persistida (insumos, % de perda, desconto...).
 */
export async function syncRecipePlatformPrices(
  recipeId: string
): Promise<SyncRecipePlatformPricesResult> {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", recipeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!recipe) {
    return { success: false, error: "Receita não encontrada." };
  }

  const [{ data: recipeIngredients }, { data: costSettings }, { data: platforms }] =
    await Promise.all([
      supabase
        .from("recipe_ingredients")
        .select("ingredient_id, quantity_used")
        .eq("recipe_id", recipeId),
      supabase.from("cost_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("delivery_platforms")
        .select("id, fee_pct")
        .eq("user_id", user.id)
        .eq("is_active", true),
    ]);

  if (!platforms || platforms.length === 0) {
    return { success: true };
  }

  const ingredientIds = [...new Set((recipeIngredients ?? []).map((item) => item.ingredient_id))];
  const { data: ingredients } =
    ingredientIds.length > 0
      ? await supabase.from("ingredients").select("id, unit_cost").in("id", ingredientIds)
      : { data: [] };

  const unitCostById = new Map((ingredients ?? []).map((i) => [i.id, i.unit_cost]));
  const recipeCost = (recipeIngredients ?? []).reduce(
    (sum, item) => sum + item.quantity_used * (unitCostById.get(item.ingredient_id) ?? 0),
    0
  );

  const pricing = computeRecipePricing({
    recipeCost,
    lossPct: recipe.loss_pct,
    costSettings: costSettings ?? null,
  });

  if (pricing.suggestedPrice === null || pricing.costWithLoss === null) {
    return { success: true };
  }

  const suggestedPrice = pricing.suggestedPrice;
  const costWithLoss = pricing.costWithLoss;

  const rows = platforms.flatMap((platform) => {
    const platformPrice = computePlatformPrice(suggestedPrice, platform.fee_pct);
    if (platformPrice === null) return [];

    const effectivePrice =
      recipe.discount_pct > 0 ? applyDiscount(platformPrice, recipe.discount_pct) : platformPrice;
    const metrics = computePriceMetrics(effectivePrice, costWithLoss, pricing.variablePct);

    return [
      {
        recipe_id: recipeId,
        platform_id: platform.id,
        suggested_price: platformPrice,
        price_with_discount: recipe.discount_pct > 0 ? effectivePrice : null,
        profit_pct: metrics.profitPct,
        profit_value: metrics.profitValue,
        cmv_pct: metrics.cmvPct,
      },
    ];
  });

  if (rows.length === 0) {
    return { success: true };
  }

  const { error } = await supabase.from("recipe_platform_prices").insert(rows);
  if (error) {
    return { success: false, error: "Não foi possível salvar o histórico de preços." };
  }

  return { success: true };
}
