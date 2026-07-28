"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  recipeSchema,
  recipeIngredientSchema,
  type RecipeInput,
  type RecipeIngredientInput,
} from "@/lib/validation/recipe";
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

  revalidatePath("/onboarding/recipes");
  return { success: true, recipe: data };
}

export async function updateRecipe(id: string, input: RecipeInput): Promise<RecipeActionResult> {
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
    .update({
      name: parsed.data.name,
      loss_pct: parsed.data.loss_pct,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: "Não foi possível salvar a receita." };
  }

  revalidatePath("/onboarding/recipes");
  revalidatePath(`/onboarding/recipes/${id}`);
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

  revalidatePath("/onboarding/recipes");
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

  revalidatePath(`/onboarding/recipes/${recipeId}`);
  revalidatePath("/onboarding/recipes");
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

  revalidatePath(`/onboarding/recipes/${recipeId}`);
  revalidatePath("/onboarding/recipes");
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

  revalidatePath(`/onboarding/recipes/${recipeId}`);
  revalidatePath("/onboarding/recipes");
  return { success: true };
}
