import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { CostSettingsForm } from "./CostSettingsForm";
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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Configurações de custos</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Esses dados servem de base para calcular o preço ideal dos seus pratos.
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            Sair
          </button>
        </form>
      </header>

      <CostSettingsForm defaultValues={defaultValues} />
    </div>
  );
}
