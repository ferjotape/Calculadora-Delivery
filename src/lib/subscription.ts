import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"];

export type SubscriptionStatus = {
  status: string | null;
  currentPeriodEnd: string | null;
  isActive: boolean;
};

/**
 * Uma assinatura é considerada ativa se o status do Stripe (mantido via
 * webhook) for "active"/"trialing", ou, como rede de segurança contra atraso
 * do webhook, se o período pago atual ainda não tiver terminado.
 */
export async function getSubscriptionStatus(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<SubscriptionStatus> {
  const { data } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    return { status: null, currentPeriodEnd: null, isActive: false };
  }

  const periodStillValid = data.current_period_end
    ? new Date(data.current_period_end) > new Date()
    : false;

  const isActive = ACTIVE_SUBSCRIPTION_STATUSES.includes(data.status) || periodStillValid;

  return { status: data.status, currentPeriodEnd: data.current_period_end, isActive };
}
