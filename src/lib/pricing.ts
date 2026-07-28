import type { CostSettings } from "@/lib/types/database";

export type RecipePricingIssue = "no_cost_settings" | "invalid_loss";

/**
 * Nunca deixamos o divisor do markup chegar a zero ou menos — cada
 * restaurante tem uma estrutura de custo diferente, então em vez de
 * bloquear o cálculo quando os percentuais somam perto de/acima de 100%,
 * aplicamos uma margem de segurança mínima e avisamos o usuário.
 */
const MIN_MARKUP_DIVISOR = 0.05;

export type RecipePricingResult = {
  costWithLoss: number | null;
  markup: number | null;
  suggestedPrice: number | null;
  /** Fração (ex: 0.1 para 10%) da soma de taxa de cartão + embalagem + entrega grátis. */
  variablePct: number;
  variableCostsApplied: number | null;
  approxProfitValue: number | null;
  approxProfitPct: number | null;
  issue: RecipePricingIssue | null;
  warning: string | null;
};

type ComputeRecipePricingInput = {
  recipeCost: number;
  lossPct: number;
  costSettings: CostSettings | null;
};

const emptyResult = (
  costWithLoss: number | null,
  issue: RecipePricingIssue,
  variablePct = 0
): RecipePricingResult => ({
  costWithLoss,
  markup: null,
  suggestedPrice: null,
  variablePct,
  variableCostsApplied: null,
  approxProfitValue: null,
  approxProfitPct: null,
  issue,
  warning: null,
});

/**
 * Custo com perda, markup ideal (a partir das Configurações de Custos) e preço
 * sugerido/lucro aproximado da receita — mesma lógica da planilha original:
 * markup = 1 / (1 - (custos fixos % + custos variáveis % + lucro desejado %)).
 */
export function computeRecipePricing({
  recipeCost,
  lossPct,
  costSettings,
}: ComputeRecipePricingInput): RecipePricingResult {
  const lossFraction = lossPct / 100;
  if (lossFraction >= 1) {
    return emptyResult(null, "invalid_loss");
  }

  const costWithLoss = recipeCost / (1 - lossFraction);

  if (!costSettings) {
    return emptyResult(costWithLoss, "no_cost_settings");
  }

  const fixedCostsTotal = costSettings.fixed_costs.reduce((sum, item) => sum + item.value, 0);
  const hasRevenueEstimate = Boolean(
    costSettings.avg_monthly_revenue && costSettings.avg_monthly_revenue > 0
  );
  let fixedPct = hasRevenueEstimate
    ? fixedCostsTotal / (costSettings.avg_monthly_revenue as number)
    : 0;
  const variablePct =
    (costSettings.card_fee_pct + costSettings.packaging_pct + costSettings.free_delivery_pct) /
    100;
  const profitPct = costSettings.desired_profit_pct / 100;

  let warning =
    fixedCostsTotal > 0 && !hasRevenueEstimate
      ? "Informe o faturamento médio mensal em Configurações de Custos para considerar os custos fixos no cálculo do markup."
      : null;

  let divisor = 1 - (fixedPct + variablePct + profitPct);

  if (divisor < MIN_MARKUP_DIVISOR) {
    // Cada restaurante tem uma estrutura de custo diferente — em vez de
    // bloquear o cálculo, primeiro reduzimos a fatia de custos fixos (é uma
    // estimativa baseada no faturamento médio, não uma taxa cobrada por
    // venda), preservando os custos variáveis reais e a margem de lucro
    // desejada pelo usuário.
    const maxFixedPct = Math.max(0, 1 - MIN_MARKUP_DIVISOR - variablePct - profitPct);
    if (fixedPct > maxFixedPct) {
      fixedPct = maxFixedPct;
      divisor = 1 - (fixedPct + variablePct + profitPct);
      warning =
        "Os custos fixos, em relação ao faturamento médio mensal informado, são altos demais para caber integralmente no preço junto com o lucro desejado. Consideramos uma fatia menor deles — revise o faturamento médio mensal ou os custos fixos em Configurações de Custos para um cálculo mais preciso.";
    }

    if (divisor < MIN_MARKUP_DIVISOR) {
      divisor = MIN_MARKUP_DIVISOR;
      warning =
        "A soma das taxas variáveis com o lucro desejado está muito próxima de (ou passa de) 100% do preço de venda. Calculamos um preço com margem de segurança mínima — revise o lucro desejado ou as taxas variáveis em Configurações de Custos.";
    }
  }

  const markup = 1 / divisor;
  const suggestedPrice = costWithLoss * markup;
  const variableCostsApplied = variablePct * suggestedPrice;
  const approxProfitValue = suggestedPrice - costWithLoss - variableCostsApplied;
  const approxProfitPct = suggestedPrice > 0 ? (approxProfitValue / suggestedPrice) * 100 : null;

  return {
    costWithLoss,
    markup,
    suggestedPrice,
    variablePct,
    variableCostsApplied,
    approxProfitValue,
    approxProfitPct,
    issue: null,
    warning,
  };
}

/** Preço de venda na plataforma para que, descontada a taxa, sobre o preço sugerido. */
export function computePlatformPrice(suggestedPrice: number, feePct: number): number | null {
  const divisor = 1 - feePct / 100;
  if (divisor <= 0) return null;
  return suggestedPrice / divisor;
}

export function applyDiscount(price: number, discountPct: number): number {
  return price * (1 - discountPct / 100);
}

export type PriceMetrics = {
  profitValue: number;
  profitPct: number;
  cmvPct: number;
};

/** Lucro (R$/%) e CMV (%) para um preço de venda específico (sugerido, de plataforma ou com desconto). */
export function computePriceMetrics(
  price: number,
  costWithLoss: number,
  variablePct: number
): PriceMetrics {
  const variableCostsApplied = variablePct * price;
  const profitValue = price - costWithLoss - variableCostsApplied;
  const profitPct = price > 0 ? (profitValue / price) * 100 : 0;
  const cmvPct = price > 0 ? (costWithLoss / price) * 100 : 0;
  return { profitValue, profitPct, cmvPct };
}

export type PracticedPriceStatus = "below" | "equal" | "above";

/** Compara o preço praticado ao preço sugerido (tolerância de ~1% para considerar "igual"). */
export function getPracticedPriceStatus(
  practicedPrice: number,
  suggestedPrice: number
): PracticedPriceStatus {
  if (suggestedPrice <= 0) return "equal";
  const diffPct = Math.abs(practicedPrice - suggestedPrice) / suggestedPrice;
  if (diffPct < 0.01) return "equal";
  return practicedPrice < suggestedPrice ? "below" : "above";
}

type RecipeIngredientLite = {
  recipe_id: string;
  ingredient_id: string;
  quantity_used: number;
};

type IngredientCostLookup = {
  id: string;
  unit_cost: number;
};

export type RecipeCostAggregate = {
  totalCost: number;
  ingredientCount: number;
};

/** Soma quantity_used * ingredient.unit_cost por receita a partir de listas já carregadas do banco. */
export function aggregateRecipeCosts(
  recipeIngredients: RecipeIngredientLite[],
  ingredients: IngredientCostLookup[]
): Map<string, RecipeCostAggregate> {
  const unitCostById = new Map(ingredients.map((i) => [i.id, i.unit_cost]));
  const costByRecipe = new Map<string, RecipeCostAggregate>();

  for (const item of recipeIngredients) {
    const unitCost = unitCostById.get(item.ingredient_id) ?? 0;
    const current = costByRecipe.get(item.recipe_id) ?? { totalCost: 0, ingredientCount: 0 };
    current.totalCost += item.quantity_used * unitCost;
    current.ingredientCount += 1;
    costByRecipe.set(item.recipe_id, current);
  }

  return costByRecipe;
}
