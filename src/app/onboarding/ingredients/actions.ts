"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ingredientSchema, type IngredientInput } from "@/lib/validation/ingredient";
import type { Ingredient } from "@/lib/types/database";

export type IngredientActionResult = {
  success: boolean;
  error?: string;
  ingredient?: Ingredient;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createIngredient(input: IngredientInput): Promise<IngredientActionResult> {
  const parsed = ingredientSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Revise os campos e tente novamente." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { data: lastIngredient } = await supabase
    .from("ingredients")
    .select("code")
    .eq("user_id", user.id)
    .order("code", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextCode = (lastIngredient?.code ?? 0) + 1;

  const { data, error } = await supabase
    .from("ingredients")
    .insert({
      user_id: user.id,
      code: nextCode,
      name: parsed.data.name,
      price_paid: parsed.data.price_paid,
      purchase_volume: parsed.data.purchase_volume,
      unit: parsed.data.unit,
      correction_factor: parsed.data.correction_factor,
    })
    .select("*")
    .single();

  if (error) {
    return { success: false, error: "Não foi possível adicionar o insumo." };
  }

  revalidatePath("/onboarding/ingredients");
  return { success: true, ingredient: data };
}

export async function updateIngredient(
  id: string,
  input: IngredientInput
): Promise<IngredientActionResult> {
  const parsed = ingredientSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Revise os campos e tente novamente." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { data, error } = await supabase
    .from("ingredients")
    .update({
      name: parsed.data.name,
      price_paid: parsed.data.price_paid,
      purchase_volume: parsed.data.purchase_volume,
      unit: parsed.data.unit,
      correction_factor: parsed.data.correction_factor,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: "Não foi possível salvar o insumo." };
  }

  revalidatePath("/onboarding/ingredients");
  return { success: true, ingredient: data };
}

export async function deleteIngredient(id: string): Promise<IngredientActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { error } = await supabase
    .from("ingredients")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: "Não foi possível remover o insumo." };
  }

  revalidatePath("/onboarding/ingredients");
  return { success: true };
}
