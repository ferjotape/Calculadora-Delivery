import type { CostSettings } from "@/lib/types/database";

export type RecipePricingIssue = "no_cost_settings" | "invalid_loss" | "markup_exceeds_100";

export type RecipePricingResult = {
  costWithLoss: number | null;
  markup: number | null;
  suggestedPrice: number | null;
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
  issue: RecipePricingIssue
): RecipePricingResult => ({
  costWithLoss,
  markup: null,
  suggestedPrice: null,
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
  const fixedPct = hasRevenueEstimate
    ? fixedCostsTotal / (costSettings.avg_monthly_revenue as number)
    : 0;
  const variablePct =
    (costSettings.card_fee_pct + costSettings.packaging_pct + costSettings.free_delivery_pct) /
    100;
  const profitPct = costSettings.desired_profit_pct / 100;

  const divisor = 1 - (fixedPct + variablePct + profitPct);
  if (divisor <= 0) {
    return emptyResult(costWithLoss, "markup_exceeds_100");
  }

  const markup = 1 / divisor;
  const suggestedPrice = costWithLoss * markup;
  const variableCostsApplied = variablePct * suggestedPrice;
  const approxProfitValue = suggestedPrice - costWithLoss - variableCostsApplied;
  const approxProfitPct = suggestedPrice > 0 ? (approxProfitValue / suggestedPrice) * 100 : null;

  const warning =
    fixedCostsTotal > 0 && !hasRevenueEstimate
      ? "Informe o faturamento médio mensal em Configurações de Custos para considerar os custos fixos no cálculo do markup."
      : null;

  return {
    costWithLoss,
    markup,
    suggestedPrice,
    variableCostsApplied,
    approxProfitValue,
    approxProfitPct,
    issue: null,
    warning,
  };
}
