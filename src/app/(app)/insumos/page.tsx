import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionStatus } from "@/lib/subscription";
import { IngredientsManager } from "./IngredientsManager";
import { ScreenHeader } from "@/components/ScreenHeader";

export default async function IngredientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const subscriptionStatus = await getSubscriptionStatus(supabase, user.id);
  if (!subscriptionStatus.isActive) {
    redirect("/billing");
  }

  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("*")
    .eq("user_id", user.id)
    .order("code", { ascending: true });

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col gap-3 overflow-hidden p-4 sm:p-6">
      <ScreenHeader
        title="Meus insumos"
        description="Cadastre os insumos usados nas suas receitas. O custo unitário é calculado automaticamente a partir do valor pago, do volume comprado e do fator de correção."
      />

      <IngredientsManager initialIngredients={ingredients ?? []} />

      <div className="flex shrink-0 justify-end border-t border-neutral-200 pt-3 dark:border-neutral-800">
        <Link
          href="/receitas"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-active"
        >
          Continuar
        </Link>
      </div>
    </div>
  );
}
