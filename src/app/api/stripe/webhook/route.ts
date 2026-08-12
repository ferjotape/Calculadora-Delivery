import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

function extractPeriodEnd(subscription: Stripe.Subscription): string | null {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
}

/**
 * Resolve qual plano corresponde à assinatura: primeiro por metadata.plan_id
 * (gravado pelo próprio app em toda criação/troca de plano feita pelo
 * Checkout ou pela tela de Assinatura), com fallback pro Price ID atual da
 * assinatura (cobre o caso de alguém mudar o preço direto no Dashboard do
 * Stripe, sem passar pelo app). Se nenhum dos dois resolver — ex: assinaturas
 * legadas com um Price ID que não existe mais em `plans` — retorna
 * undefined, e o upsert simplesmente não mexe no plan_id já salvo.
 */
async function resolvePlanId(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
): Promise<string | undefined> {
  const metadataPlanId = subscription.metadata?.plan_id;
  if (metadataPlanId) return metadataPlanId;

  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return undefined;

  const { data: plan } = await supabase
    .from("plans")
    .select("id")
    .eq("stripe_price_id", priceId)
    .maybeSingle();

  return plan?.id;
}

async function upsertSubscriptionFromStripe(
  userId: string,
  customerId: string,
  subscription: Stripe.Subscription
) {
  const supabase = createAdminClient();
  const planId = await resolvePlanId(supabase, subscription);

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_end: extractPeriodEnd(subscription),
      updated_at: new Date().toISOString(),
      ...(planId ? { plan_id: planId } : {}),
    },
    { onConflict: "user_id" }
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        if (userId && typeof session.subscription === "string" && session.customer) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const customerId =
            typeof session.customer === "string" ? session.customer : session.customer.id;
          await upsertSubscriptionFromStripe(userId, customerId, subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        if (userId) {
          await upsertSubscriptionFromStripe(userId, customerId, subscription);
        }
        break;
      }
      default:
        break;
    }
  } catch {
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
