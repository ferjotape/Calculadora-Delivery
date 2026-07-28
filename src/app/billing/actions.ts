"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import {
  SUBSCRIPTION_PRICE_BRL_CENTS,
  SUBSCRIPTION_PRODUCT_NAME,
  SUBSCRIPTION_TRIAL_DAYS,
} from "@/lib/stripe/plan";

export type CreateCheckoutSessionResult = {
  error?: string;
};

export async function createCheckoutSession(
  _prevState: CreateCheckoutSessionResult,
  _formData: FormData
): Promise<CreateCheckoutSessionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let sessionUrl: string | null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(existing?.stripe_customer_id
        ? { customer: existing.stripe_customer_id }
        : { customer_email: user.email }),
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { name: SUBSCRIPTION_PRODUCT_NAME },
            unit_amount: SUBSCRIPTION_PRICE_BRL_CENTS,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: SUBSCRIPTION_TRIAL_DAYS,
        metadata: { user_id: user.id },
      },
      metadata: { user_id: user.id },
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
