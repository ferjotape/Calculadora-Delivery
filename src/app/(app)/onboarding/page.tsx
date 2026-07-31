import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CostSettingsForm } from "./CostSettingsForm";
import { computeCostSettingsSummary, REVENUE_BELOW_FIXED_COSTS_WARNING } from "@/lib/pricing";
import type { CostSettingsInput } from "@/lib/validation/cost-settings";

export default async function OnboardingPage() {
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-12">
      <div>
        <h1 className="text-2xl">Configurações de custos</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Esses dados servem de base para calcular o preço ideal dos seus pratos.
        </p>
      </div>

      {costSummary.revenueBelowFixedCosts && (
        <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {REVENUE_BELOW_FIXED_COSTS_WARNING}
        </p>
      )}

      <CostSettingsForm defaultValues={defaultValues} />

      <div className="flex justify-end border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <Link
          href="/onboarding/platforms"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-active"
        >
          Configurar plataformas de delivery →
        </Link>
      </div>
    </div>
  );
}
