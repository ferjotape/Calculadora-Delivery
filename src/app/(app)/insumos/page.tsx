import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionStatus } from "@/lib/subscription";
import { IngredientsManager } from "./IngredientsManager";

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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-12">
      <div>
        <h1 className="text-2xl">Meus insumos</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Cadastre os insumos usados nas suas receitas. O custo unitário é calculado
          automaticamente a partir do valor pago, do volume comprado e do fator de correção.
        </p>
      </div>

      <IngredientsManager initialIngredients={ingredients ?? []} />

      <div className="flex justify-end border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <Link
          href="/receitas"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-active"
        >
          Continuar
        </Link>
      </div>
    </div>
  );
}
