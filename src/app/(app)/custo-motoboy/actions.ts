"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  deliveryCostSettingsSchema,
  type DeliveryCostSettingsInput,
} from "@/lib/validation/delivery-cost-settings";
import { computeAverageMonthlyRevenue } from "@/lib/monthly-revenue";

export type SaveDeliveryCostSettingsResult = {
  success: boolean;
  error?: string;
};

export async function saveDeliveryCostSettings(
  input: DeliveryCostSettingsInput
): Promise<SaveDeliveryCostSettingsResult> {
  const parsed = deliveryCostSettingsSchema.safeParse(input);

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

  const { error: deliveryCostError } = await supabase.from("delivery_cost_settings").upsert(
    {
      user_id: user.id,
      monthly_orders: parsed.data.monthly_orders,
      delivery_value: parsed.data.delivery_value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (deliveryCostError) {
    return { success: false, error: "Não foi possível salvar. Tente novamente." };
  }

  const year = new Date().getFullYear();
  const { data: monthlyRevenueRows } = await supabase
    .from("monthly_revenue")
    .select("value")
    .eq("user_id", user.id)
    .eq("year", year);

  const avgMonthlyRevenue = computeAverageMonthlyRevenue(monthlyRevenueRows ?? []);
  const ticketMedio =
    avgMonthlyRevenue !== null && parsed.data.monthly_orders > 0
      ? avgMonthlyRevenue / parsed.data.monthly_orders
      : null;
  const freeDeliveryPct =
    ticketMedio !== null && ticketMedio > 0
      ? (parsed.data.delivery_value / ticketMedio) * 100
      : 0;

  // Sincroniza direto na tabela cost_settings — o campo Entrega Grátis (%) em
  // Configurações de Custos é somente leitura e é alimentado a partir daqui.
  const { error: costSettingsError } = await supabase.from("cost_settings").upsert(
    {
      user_id: user.id,
      free_delivery_pct: freeDeliveryPct,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (costSettingsError) {
    return { success: false, error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/custo-motoboy");
  revalidatePath("/custos");
  return { success: true };
}
