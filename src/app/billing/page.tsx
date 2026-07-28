import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { getSubscriptionStatus } from "@/lib/subscription";
import { SUBSCRIPTION_PRICE_BRL_CENTS, SUBSCRIPTION_TRIAL_DAYS } from "@/lib/stripe/plan";
import { formatCurrency } from "@/lib/format";
import { SubscribeButton } from "./SubscribeButton";

const STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  trialing: "Em teste grátis",
  past_due: "Pagamento atrasado",
  canceled: "Cancelada",
  unpaid: "Não paga",
  incomplete: "Incompleta",
  incomplete_expired: "Expirada",
  paused: "Pausada",
};

type Props = {
  searchParams: Promise<{ success?: string; canceled?: string }>;
};

export default async function BillingPage({ searchParams }: Props) {
  const { success, canceled } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const subscription = await getSubscriptionStatus(supabase, user.id);
  const statusLabel = subscription.status
    ? (STATUS_LABELS[subscription.status] ?? subscription.status)
    : "Sem assinatura";
  const renewalDate = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-BR")
    : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Minha assinatura</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Acesso ao Precifica Delivery é por assinatura mensal.
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

      {success === "1" && (
        <p className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          Pagamento confirmado! Pode levar alguns segundos para liberarmos o acesso.
        </p>
      )}
      {canceled === "1" && (
        <p className="rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
          Checkout cancelado. Você pode assinar quando quiser.
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500">Status</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              subscription.isActive
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
            }`}
          >
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500">Renovação</span>
          <span className="text-sm font-medium">{renewalDate ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500">Valor</span>
          <span className="text-sm font-medium">
            {formatCurrency(SUBSCRIPTION_PRICE_BRL_CENTS / 100)}/mês
          </span>
        </div>
      </div>

      {!subscription.isActive && (
        <SubscribeButton
          label={`Assinar por ${formatCurrency(SUBSCRIPTION_PRICE_BRL_CENTS / 100)}/mês`}
          trialNote={`${SUBSCRIPTION_TRIAL_DAYS} dias grátis, cancele quando quiser.`}
        />
      )}
    </div>
  );
}
