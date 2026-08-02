import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode, SVGProps } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/Logo";
import { formatCurrency, formatNumber } from "@/lib/format";
import { SUBSCRIPTION_PRICE_BRL_CENTS } from "@/lib/stripe/plan";

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

const DAY_MS = 24 * 60 * 60 * 1000;
const CHART_DAYS = 30;

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // O middleware já bloqueia quem não é admin antes de chegar aqui — esta é
  // só uma segunda checagem de segurança, direto no servidor.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    redirect("/dashboard");
  }

  // Dados de todos os usuários exigem a service role (ignora RLS, que só
  // deixa cada usuário ver as próprias linhas).
  const admin = createAdminClient();

  const [profilesRes, subscriptionsRes, recipesRes, ingredientsRes, costSettingsRes] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, restaurant_name, email, created_at")
        .order("created_at", { ascending: false }),
      admin.from("subscriptions").select("user_id, status, updated_at"),
      admin.from("recipes").select("user_id"),
      admin.from("ingredients").select("user_id"),
      admin.from("cost_settings").select("user_id"),
    ]);

  const profiles = profilesRes.data ?? [];
  const subscriptions = subscriptionsRes.data ?? [];
  const recipes = recipesRes.data ?? [];
  const ingredients = ingredientsRes.data ?? [];
  const costSettingsRows = costSettingsRes.data ?? [];

  const now = new Date().getTime();

  // === Métricas de clientes ===
  const totalUsers = profiles.length;
  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const trialingCount = subscriptions.filter((s) => s.status === "trialing").length;
  const canceledCount = subscriptions.filter(
    (s) => s.status !== "active" && s.status !== "trialing"
  ).length;

  const newLast7 = profiles.filter(
    (p) => now - new Date(p.created_at).getTime() <= 7 * DAY_MS
  ).length;
  const newLast30 = profiles.filter(
    (p) => now - new Date(p.created_at).getTime() <= 30 * DAY_MS
  ).length;

  const dailySignups = Array<number>(CHART_DAYS).fill(0);
  for (const p of profiles) {
    const daysAgo = Math.floor((now - new Date(p.created_at).getTime()) / DAY_MS);
    if (daysAgo >= 0 && daysAgo < CHART_DAYS) {
      dailySignups[CHART_DAYS - 1 - daysAgo] += 1;
    }
  }

  // === Métricas financeiras ===
  const mrr = (activeCount * SUBSCRIPTION_PRICE_BRL_CENTS) / 100;

  // Aproximação: não guardamos histórico de transição de status, só o status
  // atual. "Resolvidas" = assinaturas que já passaram do trial pra um
  // desfecho final (viraram pagantes ou não); trialing/past_due/incomplete
  // ainda estão em aberto e ficam de fora da conta.
  const resolvedStatuses = new Set(["active", "canceled", "unpaid", "incomplete_expired"]);
  const resolvedCount = subscriptions.filter((s) => resolvedStatuses.has(s.status)).length;
  const conversionRate = resolvedCount > 0 ? (activeCount / resolvedCount) * 100 : null;

  // Aproximação: cancelamentos nos últimos 30 dias (por updated_at) sobre
  // ativos + esses cancelados (base de quem estava "vivo" no início do
  // período). Sem uma tabela de eventos de assinatura não dá pra ser exato.
  const canceledLast30 = subscriptions.filter(
    (s) => s.status === "canceled" && now - new Date(s.updated_at).getTime() <= 30 * DAY_MS
  ).length;
  const churnBase = activeCount + canceledLast30;
  const churnRate = churnBase > 0 ? (canceledLast30 / churnBase) * 100 : null;

  // === Métricas de uso ===
  const recipeCountByUser = new Map<string, number>();
  for (const r of recipes) {
    recipeCountByUser.set(r.user_id, (recipeCountByUser.get(r.user_id) ?? 0) + 1);
  }
  const ingredientCountByUser = new Map<string, number>();
  for (const i of ingredients) {
    ingredientCountByUser.set(i.user_id, (ingredientCountByUser.get(i.user_id) ?? 0) + 1);
  }

  const avgRecipesPerUser = totalUsers > 0 ? recipes.length / totalUsers : 0;
  const avgIngredientsPerUser = totalUsers > 0 ? ingredients.length / totalUsers : 0;

  const usersWithCostSettings = new Set(costSettingsRows.map((c) => c.user_id));
  const incompleteOnboardingCount = profiles.filter(
    (p) => usersWithCostSettings.has(p.id) && (recipeCountByUser.get(p.id) ?? 0) === 0
  ).length;

  // === Últimos usuários ===
  const subscriptionByUser = new Map(subscriptions.map((s) => [s.user_id, s]));
  const latestUsers = profiles.slice(0, 20).map((p) => ({
    ...p,
    subscriptionStatus: subscriptionByUser.get(p.id)?.status ?? null,
  }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-6 sm:py-12">
      <header className="flex items-center justify-between">
        <Logo markClassName="h-7 w-7" textClassName="text-lg" />
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
          ← Voltar ao app
        </Link>
      </header>

      <div>
        <h1 className="text-2xl">Admin</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Visão geral de clientes, financeiro e uso do CUSTTO.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg">Clientes</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard icon={<UsersIcon className="h-5 w-5" />} label="Total de usuários" value={String(totalUsers)} />
          <MetricCard
            icon={<CheckIcon className="h-5 w-5" />}
            label="Clientes ativos"
            value={String(activeCount)}
            valueClassName="text-green-600 dark:text-green-500"
          />
          <MetricCard
            icon={<ClockIcon className="h-5 w-5" />}
            label="Em trial"
            value={String(trialingCount)}
            valueClassName="text-amber-600 dark:text-amber-500"
          />
          <MetricCard
            icon={<XIcon className="h-5 w-5" />}
            label="Cancelados/expirados"
            value={String(canceledCount)}
            valueClassName="text-red-600 dark:text-red-500"
          />
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium">Novos cadastros</p>
            <p className="font-mono text-xs text-neutral-500">
              {newLast7} nos últimos 7 dias · {newLast30} nos últimos 30 dias
            </p>
          </div>
          <SignupsChart data={dailySignups} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg">Financeiro</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <MetricCard icon={<CoinIcon className="h-5 w-5" />} label="MRR" value={formatCurrency(mrr)} />
          <MetricCard
            icon={<TrendingUpIcon className="h-5 w-5" />}
            label="Conversão trial → pago"
            value={conversionRate !== null ? `${formatNumber(conversionRate, { maximumFractionDigits: 1 })}%` : "—"}
            caption={conversionRate === null ? "Ainda sem assinaturas resolvidas" : undefined}
          />
          <MetricCard
            icon={<TrendingDownIcon className="h-5 w-5" />}
            label="Churn (últimos 30 dias)"
            value={churnRate !== null ? `${formatNumber(churnRate, { maximumFractionDigits: 1 })}%` : "—"}
            caption={churnRate === null ? "Ainda sem clientes ativos" : undefined}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg">Uso</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <MetricCard
            icon={<RecipeBookIcon className="h-5 w-5" />}
            label="Receitas por usuário"
            value={formatNumber(avgRecipesPerUser, { maximumFractionDigits: 1 })}
          />
          <MetricCard
            icon={<IngredientsIcon className="h-5 w-5" />}
            label="Insumos por usuário"
            value={formatNumber(avgIngredientsPerUser, { maximumFractionDigits: 1 })}
          />
          <MetricCard
            icon={<AlertIcon className="h-5 w-5" />}
            label="Onboarding incompleto"
            value={String(incompleteOnboardingCount)}
            caption="Configurou custos, mas não criou nenhuma receita"
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg">Últimos cadastros</h2>
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <th className="px-3 py-2 font-medium">Restaurante</th>
                <th className="px-3 py-2 font-medium">E-mail</th>
                <th className="px-3 py-2 font-medium">Assinatura</th>
                <th className="px-3 py-2 font-medium">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {latestUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-neutral-400">
                    Nenhum usuário cadastrado ainda.
                  </td>
                </tr>
              ) : (
                latestUsers.map((u) => (
                  <tr key={u.id} className="border-b border-neutral-200 last:border-b-0 dark:border-neutral-800">
                    <td className="px-3 py-2 font-medium">{u.restaurant_name ?? "—"}</td>
                    <td className="px-3 py-2 text-neutral-500">{u.email ?? "—"}</td>
                    <td className="px-3 py-2">
                      {u.subscriptionStatus ? (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium dark:bg-neutral-800">
                          {STATUS_LABELS[u.subscriptionStatus] ?? u.subscriptionStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">Sem assinatura</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-neutral-500">
                      {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  valueClassName,
  caption,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
  caption?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
        {icon}
      </span>
      <div>
        <p className={`font-mono text-xl font-semibold sm:text-2xl ${valueClassName ?? ""}`}>{value}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">{label}</p>
        {caption && <p className="mt-1 text-xs normal-case text-neutral-400">{caption}</p>}
      </div>
    </div>
  );
}

function SignupsChart({ data }: { data: number[] }) {
  const width = 600;
  const height = 100;
  const max = Math.max(...data, 1);
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const points = data
    .map((value, index) => {
      const x = index * stepX;
      const y = height - 8 - (value / max) * (height - 16);
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <div className="flex flex-col gap-1">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-24 w-full">
        <line x1="0" y1={height - 8} x2={width} y2={height - 8} stroke="var(--hairline)" strokeWidth="1" />
        <polygon points={areaPoints} fill="var(--accent)" fillOpacity="0.08" />
        <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="flex justify-between text-xs text-neutral-400">
        <span>{CHART_DAYS} dias atrás</span>
        <span>Hoje</span>
      </div>
    </div>
  );
}

function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="7.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 16.5C2.5 13.5 4.7 11.5 7.5 11.5C10.3 11.5 12.5 13.5 12.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.5 12C14.7 12 16.5 13.6 16.5 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11.5 6.7C12.2 6.2 12.7 5.4 12.7 4.5C12.7 3.6 12.2 2.8 11.5 2.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 10L9 12.5L13.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6V10L12.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.5 7.5L12.5 12.5M12.5 7.5L7.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CoinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6.2V13.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M12.1 8.1C12.1 7.27 11.16 6.6 10 6.6C8.84 6.6 7.9 7.27 7.9 8.1C7.9 8.93 8.66 9.3 10 9.6C11.34 9.9 12.1 10.27 12.1 11.1C12.1 11.93 11.16 12.6 10 12.6C8.84 12.6 7.9 11.93 7.9 11.1"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrendingUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M3 13L8 8L11.5 11.5L17 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 6H17V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendingDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M3 7L8 12L11.5 8.5L17 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 14H17V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RecipeBookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M10 4.5C8.5 3.5 6 3.2 4 3.6V15.6C6 15.2 8.5 15.5 10 16.5C11.5 15.5 14 15.2 16 15.6V3.6C14 3.2 11.5 3.5 10 4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 4.5V16.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IngredientsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M4 8H16L15 16.5C14.9 17.3 14.2 18 13.4 18H6.6C5.8 18 5.1 17.3 5 16.5L4 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7 8V6C7 4.3 8.3 3 10 3C11.7 3 13 4.3 13 6V8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function AlertIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M10 2.5L18 16.5H2L10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 8V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="14" r="0.9" fill="currentColor" />
    </svg>
  );
}
