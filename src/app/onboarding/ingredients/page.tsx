import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { IngredientsManager } from "./IngredientsManager";

export default async function IngredientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("*")
    .eq("user_id", user.id)
    .order("code", { ascending: true });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Meus insumos</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Cadastre os insumos usados nas suas receitas. O custo unitário é calculado
            automaticamente a partir do valor pago, do volume comprado e do fator de correção.
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

      <IngredientsManager initialIngredients={ingredients ?? []} />

      <div className="flex justify-end border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <Link
          href="/onboarding"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Continuar
        </Link>
      </div>
    </div>
  );
}
