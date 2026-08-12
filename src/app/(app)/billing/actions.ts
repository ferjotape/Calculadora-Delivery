"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { ACTIVE_SUBSCRIPTION_STATUSES } from "@/lib/subscription";
import type { PlanId } from "@/lib/stripe/plan";

export type ChangePlanResult = {
  error?: string;
};

/**
 * Ação única pra trocar de plano: cria um Checkout novo quando o usuário
 * ainda não tem assinatura paga ativa; se já tem, atualiza o preço da
 * assinatura existente em vez de criar uma segunda (evita cobrança
 * duplicada); voltar pro Gratuito agenda o cancelamento pro fim do
 * período já pago.
 */
export async function changePlan(
  planId: PlanId,
  _prevState: ChangePlanResult,
  _formData: FormData
): Promise<ChangePlanResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const [{ data: plan }, { data: subscription }] = await Promise.all([
    supabase.from("plans").select("*").eq("id", planId).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, status")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!plan) {
    return { error: "Plano não encontrado." };
  }

  const hasActiveSubscription =
    Boolean(subscription?.stripe_subscription_id) &&
    Boolean(subscription?.status) &&
    ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription!.status);

  if (planId === "gratuito") {
    if (!hasActiveSubscription || !subscription?.stripe_subscription_id) {
      return { error: "Você já está no plano Gratuito." };
    }

    try {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    } catch {
      return { error: "Não foi possível cancelar a assinatura. Tente novamente." };
    }

    redirect("/billing?canceled=1");
  }

  if (!plan.stripe_price_id) {
    return { error: "Este plano ainda não está disponível para assinatura." };
  }

  if (hasActiveSubscription && subscription?.stripe_subscription_id) {
    try {
      const existing = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
      const itemId = existing.items.data[0]?.id;
      if (!itemId) {
        return { error: "Não foi possível localizar sua assinatura atual." };
      }
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        items: [{ id: itemId, price: plan.stripe_price_id }],
        proration_behavior: "create_prorations",
        cancel_at_period_end: false,
        metadata: { user_id: user.id, plan_id: planId },
      });
    } catch {
      return { error: "Não foi possível atualizar sua assinatura. Tente novamente." };
    }

    redirect("/billing?success=1");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let sessionUrl: string | null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(subscription?.stripe_customer_id
        ? { customer: subscription.stripe_customer_id }
        : { customer_email: user.email }),
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      subscription_data: {
        metadata: { user_id: user.id, plan_id: planId },
      },
      metadata: { user_id: user.id, plan_id: planId },
      success_url: `${siteUrl}/billing?success=1`,
      cancel_url: `${siteUrl}/billing?canceled=1`,
    });
    sessionUrl = session.url;
  } catch {
    return { error: "Não foi possível iniciar o checkout. Tente novamente." };
  }

  if (!sessionUrl) {
    return { error: "Não foi possível iniciar o checkout. Tente novamente." };
  }

  redirect(sessionUrl);
}
