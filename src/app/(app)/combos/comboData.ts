import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, CostSettings, Combo } from "@/lib/types/database";
import { aggregateRecipeCosts, computeRecipePricing } from "@/lib/pricing";

export type ComboRecipeLine = {
  id: string;
  recipeId: string;
  recipeName: string;
  quantity: number;
  costWithLoss: number | null;
  suggestedPrice: number | null;
};

export type ComboAggregates = {
  combo: Combo;
  lines: ComboRecipeLine[];
  /** Soma de (custo_com_perda * quantidade) das receitas do combo. */
  totalCost: number;
  /** Soma de (preço_sugerido * quantidade) das receitas do combo. */
  summedPrice: number;
  costSettings: CostSettings | null;
  /** true quando alguma receita do combo não tem preço calculável (ex: sem Configurações de Custos). */
  hasIssue: boolean;
};

/**
 * Busca o combo + itens + dados necessários pra calcular custo total e preço
 * somado (soma do preço sugerido de cada receita, mesmo cálculo de
 * computeRecipePricing usado na tela de receitas). Usado tanto pela página de
 * detalhe do combo (render inicial) quanto pela action de salvar precificação
 * (revalidação no servidor, nunca confia só no client).
 */
export async function loadComboAggregates(
  supabase: SupabaseClient<Database>,
  userId: string,
  comboId: string
): Promise<ComboAggregates | null> {
  const { data: combo } = await supabase
    .from("combos")
    .select("*")
    .eq("id", comboId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!combo) return null;

  const [{ data: comboRecipes }, { data: costSettings }] = await Promise.all([
    supabase.from("combo_recipes").select("*").eq("combo_id", comboId),
    supabase.from("cost_settings").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const recipeIds = [...new Set((comboRecipes ?? []).map((cr) => cr.recipe_id))];

  const { data: recipes } =
    recipeIds.length > 0
      ? await supabase.from("recipes").select("id, name, loss_pct").in("id", recipeIds)
      : { data: [] };

  const { data: recipeIngredients } =
    recipeIds.length > 0
      ? await supabase
          .from("recipe_ingredients")
          .select("recipe_id, ingredient_id, quantity_used")
          .in("recipe_id", recipeIds)
      : { data: [] };

  const ingredientIds = [...new Set((recipeIngredients ?? []).map((ri) => ri.ingredient_id))];
  const { data: ingredients } =
    ingredientIds.length > 0
      ? await supabase.from("ingredients").select("id, unit_cost").in("id", ingredientIds)
      : { data: [] };

  const costByRecipe = aggregateRecipeCosts(recipeIngredients ?? [], ingredients ?? []);
  const recipesById = new Map((recipes ?? []).map((r) => [r.id, r]));

  let totalCost = 0;
  let summedPrice = 0;
  let hasIssue = false;

  const lines: ComboRecipeLine[] = (comboRecipes ?? []).map((comboRecipe) => {
    const recipe = recipesById.get(comboRecipe.recipe_id);
    const recipeCost = costByRecipe.get(comboRecipe.recipe_id)?.totalCost ?? 0;
    const pricing = computeRecipePricing({
      recipeCost,
      lossPct: recipe?.loss_pct ?? 0,
      costSettings: costSettings ?? null,
    });

    if (pricing.costWithLoss === null || pricing.suggestedPrice === null) {
      hasIssue = true;
    } else {
      totalCost += pricing.costWithLoss * comboRecipe.quantity;
      summedPrice += pricing.suggestedPrice * comboRecipe.quantity;
    }

    return {
      id: comboRecipe.id,
      recipeId: comboRecipe.recipe_id,
      recipeName: recipe?.name ?? "Receita removida",
      quantity: comboRecipe.quantity,
      costWithLoss: pricing.costWithLoss,
      suggestedPrice: pricing.suggestedPrice,
    };
  });

  return { combo, lines, totalCost, summedPrice, costSettings: costSettings ?? null, hasIssue };
}
