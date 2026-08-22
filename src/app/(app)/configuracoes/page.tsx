import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePlan } from "@/lib/subscription";
import { formatCurrency } from "@/lib/format";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { LogoutButton } from "@/components/LogoutButton";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, effectivePlan] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getEffectivePlan(supabase, user.id),
  ]);

  const priceLabel =
    effectivePlan.priceCents === 0
      ? "Grátis"
      : `${formatCurrency(effectivePlan.priceCents / 100)}/mês`;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 sm:p-6">
      <ScreenHeader title="Configurações" description="Gerencie os dados da sua conta CUSTTO." />

      <Card title="Dados da conta">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-neutral-500">Nome do restaurante</span>
          <span className="text-sm font-medium">{profile?.restaurant_name ?? "—"}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-neutral-500">E-mail</span>
          <span className="text-sm font-medium">{user.email}</span>
        </div>
      </Card>

      <Card title="Plano atual" description="Veja os detalhes do seu plano ou faça um upgrade.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-base font-medium">{effectivePlan.name}</p>
            <p className="text-sm text-neutral-500">{priceLabel}</p>
          </div>
          <Link
            href="/billing"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Ver planos
          </Link>
        </div>
      </Card>

      <Card title="Alterar senha" description="Informe sua senha atual e escolha uma nova.">
        <ChangePasswordForm />
      </Card>

      <Card title="Sair da conta">
        <form action={logout}>
          <LogoutButton />
        </form>
      </Card>
    </div>
  );
}
