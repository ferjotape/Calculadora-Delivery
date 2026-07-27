"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { costSettingsSchema, type CostSettingsInput } from "@/lib/validation/cost-settings";

export type SaveCostSettingsResult = {
  success: boolean;
  error?: string;
};

export async function saveCostSettings(
  input: CostSettingsInput
): Promise<SaveCostSettingsResult> {
  const parsed = costSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Revise os campos e tente novamente." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { error } = await supabase
    .from("cost_settings")
    .upsert(
      {
        user_id: user.id,
        fixed_costs: parsed.data.fixed_costs,
        card_fee_pct: parsed.data.card_fee_pct,
        packaging_pct: parsed.data.packaging_pct,
        free_delivery_pct: parsed.data.free_delivery_pct,
        desired_profit_pct: parsed.data.desired_profit_pct,
        avg_monthly_revenue: parsed.data.avg_monthly_revenue,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    return { success: false, error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/onboarding");
  return { success: true };
}
