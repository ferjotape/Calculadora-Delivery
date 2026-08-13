"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePlan } from "@/lib/subscription";
import {
  comboSchema,
  comboPricingSchema,
  type ComboInput,
  type ComboPricingInput,
} from "@/lib/validation/combo";
import {
  computeComboMinPrice,
  computeComboPromoPrice,
  computeComboRecommendedPrice,
  resolveSafetyMarginPct,
} from "@/lib/pricing";
import { formatCurrency, formatNumber } from "@/lib/format";
import { loadComboAggregates } from "./comboData";
import type { Combo, ComboRecipe } from "@/lib/types/database";

export type ComboWithItems = Combo & { items: ComboRecipe[] };

export type ComboActionResult = {
  success: boolean;
  error?: string;
  combo?: ComboWithItems;
};

async function requireBusinessUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, hasCombos: false };
  }

  const plan = await getEffectivePlan(supabase, user.id);
  return { supabase, user, hasCombos: plan.hasCombos };
}

export async function createCombo(input: ComboInput): Promise<ComboActionResult> {
  const parsed = comboSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Revise o nome e as receitas do combo." };
  }

  const { supabase, user, hasCombos } = await requireBusinessUser();
  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }
  if (!hasCombos) {
    return { success: false, error: "Combos disponível apenas no plano Business." };
  }

  const { data: combo, error: comboError } = await supabase
    .from("combos")
    .insert({ user_id: user.id, name: parsed.data.name })
    .select("*")
    .single();

  if (comboError || !combo) {
    return { success: false, error: "Não foi possível criar o combo." };
  }

  const { data: items, error: itemsError } = await supabase
    .from("combo_recipes")
    .insert(
      parsed.data.items.map((item) => ({
        combo_id: combo.id,
        recipe_id: item.recipe_id,
        quantity: item.quantity,
      }))
    )
    .select("*");

  if (itemsError || !items) {
    // Não deixa o combo órfão (sem nenhuma receita) se o insert dos itens falhar.
    await supabase.from("combos").delete().eq("id", combo.id);
    return { success: false, error: "Não foi possível salvar as receitas do combo." };
  }

  revalidatePath("/combos");
  return { success: true, combo: { ...combo, items } };
}

export async function deleteCombo(id: string): Promise<ComboActionResult> {
  const { supabase, user, hasCombos } = await requireBusinessUser();
  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }
  if (!hasCombos) {
    return { success: false, error: "Combos disponível apenas no plano Business." };
  }

  const { error } = await supabase.from("combos").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    return { success: false, error: "Não foi possível remover o combo." };
  }

  revalidatePath("/combos");
  return { success: true };
}

export type ComboPricingActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Salva margem de segurança, desconto promocional e preço praticado do combo.
 * Recalcula o preço mínimo no servidor a partir dos dados reais do combo (nunca
 * confia nos valores calculados no client) e bloqueia o salvamento se o desconto
 * promocional ou o preço praticado ficarem abaixo do preço mínimo sustentável.
 */
export async function updateComboPricing(
  comboId: string,
  input: ComboPricingInput
): Promise<ComboPricingActionResult> {
  const parsed = comboPricingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Revise os campos de precificação." };
  }

  const { supabase, user, hasCombos } = await requireBusinessUser();
  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }
  if (!hasCombos) {
    return { success: false, error: "Combos disponível apenas no plano Business." };
  }

  const aggregates = await loadComboAggregates(supabase, user.id, comboId);
  if (!aggregates) {
    return { success: false, error: "Combo não encontrado." };
  }

  const safetyMarginPct = resolveSafetyMarginPct(
    parsed.data.safety_margin_type,
    parsed.data.safety_margin_custom_pct
  );
  const { minPrice } = computeComboMinPrice(
    aggregates.totalCost,
    aggregates.costSettings,
    safetyMarginPct
  );

  if (minPrice === null) {
    return {
      success: false,
      error: "Configure seus custos em Configurações de Custos antes de definir o preço do combo.",
    };
  }

  const { recommended } = computeComboRecommendedPrice(
    aggregates.summedPrice,
    aggregates.totalCost,
    aggregates.costSettings
  );
  const promo = computeComboPromoPrice(recommended, minPrice, parsed.data.promo_discount_pct);

  if (promo.belowMin) {
    const maxPct = promo.maxDiscountPct !== null ? formatNumber(promo.maxDiscountPct, { maximumFractionDigits: 1 }) : "0";
    return {
      success: false,
      error: `Esse desconto deixaria o combo abaixo do preço mínimo sustentável (${formatCurrency(minPrice)}). Desconto máximo permitido: ${maxPct}%.`,
    };
  }

  if (parsed.data.practiced_price < minPrice) {
    return {
      success: false,
      error: `O preço praticado não pode ficar abaixo do preço mínimo sustentável (${formatCurrency(minPrice)}).`,
    };
  }

  const { error } = await supabase
    .from("combos")
    .update({
      safety_margin_type: parsed.data.safety_margin_type,
      safety_margin_custom_pct: parsed.data.safety_margin_custom_pct,
      promo_discount_pct: parsed.data.promo_discount_pct,
      practiced_price: parsed.data.practiced_price,
    })
    .eq("id", comboId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: "Não foi possível salvar a precificação do combo." };
  }

  revalidatePath(`/combos/${comboId}`);
  return { success: true };
}
