import type { SupabaseClient } from "@supabase/supabase-js";
import type { CostSettings, Database } from "@/lib/types/database";

/** Média dos meses preenchidos em monthly_revenue — meses vazios não entram na conta. */
export function computeAverageMonthlyRevenue(rows: { value: number }[]): number | null {
  if (rows.length === 0) return null;
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return total / rows.length;
}

export type MonthlyRevenueRow = { month: number; value: number };

/**
 * Mês mais recente preenchido na aba Faturamento Anual (maior número do mês),
 * pro bloco "Ticket Médio" de Custo Motoboy — nunca a média de vários meses.
 * Atualiza sozinho assim que um mês mais novo é preenchido.
 */
export function getLatestMonth(rows: MonthlyRevenueRow[]): MonthlyRevenueRow | null {
  if (rows.length === 0) return null;
  return rows.reduce((latest, row) => (row.month > latest.month ? row : latest));
}

/**
 * Única fonte de verdade do faturamento médio usado em qualquer cálculo (%
 * custo fixo, markup atual, preço sugerido de receitas/combos): sempre
 * recalculado na hora a partir de monthly_revenue (ano corrente), nunca lido
 * do snapshot em cost_settings.avg_monthly_revenue — esse snapshot só é
 * atualizado quando o usuário salva a tela de Configurações de Custos e pode
 * ficar desatualizado em relação à aba Faturamento Anual. Toda tela/action que
 * precisa das Configurações de Custos para calcular preço ou markup deve
 * buscar os dados por aqui em vez de selecionar "cost_settings" direto.
 */
export async function loadCostSettingsWithLiveRevenue(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CostSettings | null> {
  const currentYear = new Date().getFullYear();
  const [{ data: costSettings }, { data: monthlyRevenueRows }] = await Promise.all([
    supabase.from("cost_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("monthly_revenue")
      .select("value")
      .eq("user_id", userId)
      .eq("year", currentYear),
  ]);

  if (!costSettings) return null;

  return {
    ...costSettings,
    avg_monthly_revenue: computeAverageMonthlyRevenue(monthlyRevenueRows ?? []),
  };
}
