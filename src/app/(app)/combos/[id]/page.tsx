import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePlan } from "@/lib/subscription";
import { loadComboAggregates } from "../comboData";
import { ComboLockScreen } from "../ComboLockScreen";
import { ComboDetailManager } from "./ComboDetailManager";
import { ScreenHeader } from "@/components/ScreenHeader";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ComboDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const plan = await getEffectivePlan(supabase, user.id);

  if (!plan.hasCombos) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-4 sm:p-6">
        <ScreenHeader title="Combo" description="Precificação do combo." />
        <ComboLockScreen />
      </div>
    );
  }

  const aggregates = await loadComboAggregates(supabase, user.id, id);
  if (!aggregates) {
    redirect("/combos");
  }

  const { data: platforms } = await supabase
    .from("delivery_platforms")
    .select("id, name, fee_pct")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-4 sm:p-6">
      <ScreenHeader title={aggregates.combo.name} backHref="/combos" backLabel="← Voltar para combos" />

      <ComboDetailManager
        combo={aggregates.combo}
        lines={aggregates.lines}
        totalCost={aggregates.totalCost}
        summedPrice={aggregates.summedPrice}
        costSettings={aggregates.costSettings}
        hasIssue={aggregates.hasIssue}
        platforms={platforms ?? []}
      />
    </div>
  );
}
