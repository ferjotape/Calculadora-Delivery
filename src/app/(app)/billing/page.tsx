import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePlan } from "@/lib/subscription";
import { formatCurrency } from "@/lib/format";
import { PlanActionButton } from "./PlanActionButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import type { Plan } from "@/lib/types/database";
import type { PlanId } from "@/lib/stripe/plan";

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

  const [effectivePlan, { data: plans }] = await Promise.all([
    getEffectivePlan(supabase, user.id),
    supabase.from("plans").select("*").order("display_order", { ascending: true }),
  ]);

  const statusLabel = effectivePlan.status
    ? (STATUS_LABELS[effectivePlan.status] ?? effectivePlan.status)
    : "Sem assinatura paga";
  const renewalDate = effectivePlan.currentPeriodEnd
    ? new Date(effectivePlan.currentPeriodEnd).toLocaleDateString("pt-BR")
    : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 sm:p-6">
      <ScreenHeader
        title="Minha assinatura"
        description="Escolha o plano que faz sentido pro tamanho do seu cardápio."
      />

      {success === "1" && (
        <p className="shrink-0 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          Pagamento confirmado! Pode levar alguns segundos para atualizarmos seu plano.
        </p>
      )}
      {canceled === "1" && (
        <p className="shrink-0 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
          Tudo certo. Alterações no plano podem levar alguns segundos para aparecer.
        </p>
      )}

      {effectivePlan.isPaid && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-neutral-300 p-4 text-sm dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">Status</span>
            <span className="rounded-full bg-green-100 px-2 py-0.5 font-mono text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
              {statusLabel}
            </span>
          </div>
          {renewalDate && (
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">Renovação</span>
              <span className="font-mono font-medium">{renewalDate}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(plans ?? []).map((plan) => (
          <PlanCard key={plan.id} plan={plan} isCurrent={plan.id === effectivePlan.planId} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan, isCurrent }: { plan: Plan; isCurrent: boolean }) {
  const isFeatured = plan.id === "profissional";
  const priceLabel = plan.price_cents === 0 ? "Grátis" : formatCurrency(plan.price_cents / 100);

  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border p-5 ${
        isFeatured
          ? "border-accent shadow-[0_0_0_1px_var(--accent)]"
          : "border-neutral-300 dark:border-neutral-700"
      }`}
    >
      {isFeatured && (
        <span className="w-fit rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white">
          Mais popular
        </span>
      )}

      <div>
        <h3 className="text-lg font-medium">{plan.name}</h3>
        <p className="mt-1 font-mono text-2xl font-semibold">
          {priceLabel}
          {plan.price_cents > 0 && (
            <span className="text-sm font-normal text-neutral-500">/mês</span>
          )}
        </p>
      </div>

      <ul className="flex flex-1 flex-col gap-2 text-sm">
        <li className="flex items-start gap-2">
          <CheckIcon />
          <span>
            {plan.recipe_limit === null
              ? "Receitas ilimitadas"
              : `Até ${plan.recipe_limit} receita${plan.recipe_limit === 1 ? "" : "s"}`}
          </span>
        </li>
        {plan.has_combos && (
          <li className="flex items-start gap-2">
            <CheckIcon />
            <span className="flex items-center gap-1.5">
              Aba de Combos
              <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                Em breve
              </span>
            </span>
          </li>
        )}
      </ul>

      {isCurrent ? (
        <span className="w-full rounded-md border border-neutral-300 px-4 py-2.5 text-center text-sm font-medium text-neutral-500 dark:border-neutral-700">
          Plano atual
        </span>
      ) : (
        <PlanActionButton
          planId={plan.id as PlanId}
          label={plan.id === "gratuito" ? "Voltar ao Gratuito" : "Assinar"}
          variant={isFeatured ? "primary" : "secondary"}
        />
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mt-0.5 h-4 w-4 shrink-0 text-accent"
    >
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.5 10L9 12.5L13.5 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
