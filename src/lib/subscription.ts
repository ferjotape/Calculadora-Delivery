import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Plan } from "@/lib/types/database";

export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"];

export type EffectivePlan = {
  planId: string;
  name: string;
  priceCents: number;
  recipeLimit: number | null;
  hasCombos: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
  isPaid: boolean;
};

const FALLBACK_PLAN: Plan = {
  id: "gratuito",
  name: "Gratuito",
  price_cents: 0,
  recipe_limit: 2,
  has_combos: false,
  stripe_price_id: null,
  display_order: 1,
  created_at: "",
};

/**
 * Resolve o plano efetivo do usuário: o plano da assinatura no Stripe
 * enquanto ela estiver ativa (ou, como rede de segurança contra atraso do
 * webhook, enquanto o período pago atual não tiver terminado); caso
 * contrário, "gratuito" — inclusive para quem nunca assinou nada.
 */
export async function getEffectivePlan(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<EffectivePlan> {
  const [{ data: subscription }, { data: plans }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan_id, status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("plans").select("*"),
  ]);

  const plansById = new Map((plans ?? []).map((plan) => [plan.id, plan]));

  let planId = "gratuito";
  if (subscription) {
    const periodStillValid = subscription.current_period_end
      ? new Date(subscription.current_period_end) > new Date()
      : false;
    const isActive =
      ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status) || periodStillValid;
    if (isActive) {
      planId = subscription.plan_id;
    }
  }

  const plan = plansById.get(planId) ?? plansById.get("gratuito") ?? FALLBACK_PLAN;

  return {
    planId: plan.id,
    name: plan.name,
    priceCents: plan.price_cents,
    recipeLimit: plan.recipe_limit,
    hasCombos: plan.has_combos,
    status: subscription?.status ?? null,
    currentPeriodEnd: subscription?.current_period_end ?? null,
    isPaid: plan.id !== "gratuito",
  };
}
