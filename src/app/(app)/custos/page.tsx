import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeAverageMonthlyRevenue } from "@/lib/monthly-revenue";
import { CostSettingsForm } from "./CostSettingsForm";
import { computeCostSettingsSummary, REVENUE_BELOW_FIXED_COSTS_WARNING } from "@/lib/pricing";
import type { CostSettingsInput } from "@/lib/validation/cost-settings";
import { ScreenHeader } from "@/components/ScreenHeader";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

type MonthlyRow = { month: number; value: number; orders_count: number | null };

function buildMonthlyValues(rows: MonthlyRow[] | null | undefined) {
  return Array.from({ length: 12 }, (_, i) => {
    const row = rows?.find((r) => r.month === i + 1);
    return row ? row.value : null;
  });
}

function buildMonthlyOrders(rows: MonthlyRow[] | null | undefined) {
  return Array.from({ length: 12 }, (_, i) => {
    const row = rows?.find((r) => r.month === i + 1);
    return row ? row.orders_count : null;
  });
}

export default async function CustosPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const currentYear = new Date().getFullYear();
  const { year: yearParam } = await searchParams;
  const requestedYear = yearParam ? parseInt(yearParam, 10) : currentYear;
  const viewYear =
    Number.isFinite(requestedYear) && requestedYear <= currentYear ? requestedYear : currentYear;

  const [{ data: costSettings }, { data: currentYearRows }, { data: viewYearRows }] =
    await Promise.all([
      supabase.from("cost_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("monthly_revenue")
        .select("month, value, orders_count")
        .eq("user_id", user.id)
        .eq("year", currentYear),
      viewYear === currentYear
        ? Promise.resolve({ data: null })
        : supabase
            .from("monthly_revenue")
            .select("month, value, orders_count")
            .eq("user_id", user.id)
            .eq("year", viewYear),
    ]);

  // Única fonte de verdade do faturamento médio: sempre a soma dos meses
  // preenchidos do ano corrente ÷ quantidade de meses preenchidos — a mesma
  // conta exibida logo abaixo, no bloco "Faturamento anual". Nunca usamos o
  // snapshot em cost_settings.avg_monthly_revenue para calcular nada.
  const liveAvgMonthlyRevenue = computeAverageMonthlyRevenue(currentYearRows ?? []);

  const defaultValues: CostSettingsInput = {
    fixed_costs: costSettings?.fixed_costs ?? [],
    card_fee_pct: costSettings?.card_fee_pct ?? 0,
    packaging_pct: costSettings?.packaging_pct ?? 0,
    free_delivery_pct: costSettings?.free_delivery_pct ?? 0,
    desired_profit_pct: costSettings?.desired_profit_pct ?? 0,
    avg_monthly_revenue: liveAvgMonthlyRevenue,
  };

  const currentYearValues = buildMonthlyValues(currentYearRows);
  const viewYearValues = viewYear === currentYear ? currentYearValues : buildMonthlyValues(viewYearRows);
  const currentYearOrders = buildMonthlyOrders(currentYearRows);
  const viewYearOrders = viewYear === currentYear ? currentYearOrders : buildMonthlyOrders(viewYearRows);

  const costSummary = computeCostSettingsSummary(
    costSettings ? { ...costSettings, avg_monthly_revenue: liveAvgMonthlyRevenue } : null
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-4 sm:p-6">
      <ScreenHeader
        title="Configurações de custos"
        description="Esses dados servem de base para calcular o preço ideal dos seus pratos."
      />

      {costSummary.revenueBelowFixedCosts && (
        <p className="shrink-0 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {REVENUE_BELOW_FIXED_COSTS_WARNING}
        </p>
      )}

      <CostSettingsForm
        defaultValues={defaultValues}
        currentYear={currentYear}
        viewYear={viewYear}
        currentYearValues={currentYearValues}
        viewYearValues={viewYearValues}
        currentYearOrders={currentYearOrders}
        viewYearOrders={viewYearOrders}
      />

      <div className="flex shrink-0 justify-end border-t border-neutral-200 pt-3 dark:border-neutral-800">
        <Link
          href="/plataformas"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-active"
        >
          Configurar plataformas de delivery →
        </Link>
      </div>
    </div>
  );
}
