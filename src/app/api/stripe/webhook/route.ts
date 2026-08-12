import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

function extractPeriodEnd(subscription: Stripe.Subscription): string | null {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
}

async function upsertSubscriptionFromStripe(
  userId: string,
  customerId: string,
  subscription: Stripe.Subscription
) {
  const supabase = createAdminClient();
  // plan_id só é conhecido quando o próprio app criou/atualizou a assinatura
  // (sempre grava metadata.plan_id nesses casos). Quando ausente — ex:
  // assinaturas legadas de antes do modelo de 4 planos — omitimos a chave do
  // upsert pra não sobrescrever o plan_id já definido manualmente no banco.
  const planId = subscription.metadata?.plan_id;

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
