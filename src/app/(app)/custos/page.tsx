import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CostSettingsForm } from "./CostSettingsForm";
import { computeCostSettingsSummary, REVENUE_BELOW_FIXED_COSTS_WARNING } from "@/lib/pricing";
import type { CostSettingsInput } from "@/lib/validation/cost-settings";
import { ScreenHeader } from "@/components/ScreenHeader";

export default async function CustosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: costSettings } = await supabase
    .from("cost_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const defaultValues: CostSettingsInput = {
    fixed_costs: costSettings?.fixed_costs ?? [],
    card_fee_pct: costSettings?.card_fee_pct ?? 0,
    packaging_pct: costSettings?.packaging_pct ?? 0,
    free_delivery_pct: costSettings?.free_delivery_pct ?? 0,
    desired_profit_pct: costSettings?.desired_profit_pct ?? 0,
    avg_monthly_revenue: costSettings?.avg_monthly_revenue ?? null,
  };

  const costSummary = computeCostSettingsSummary(costSettings ?? null);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col gap-3 overflow-hidden p-4 sm:p-6">
      <ScreenHeader
        title="Configurações de custos"
        description="Esses dados servem de base para calcular o preço ideal dos seus pratos."
      />

      {costSummary.revenueBelowFixedCosts && (
        <p className="shrink-0 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {REVENUE_BELOW_FIXED_COSTS_WARNING}
        </p>
      )}

      <CostSettingsForm defaultValues={defaultValues} />

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
