import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { RecipeDetailManager } from "./RecipeDetailManager";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RecipeDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!recipe) {
    redirect("/onboarding/recipes");
  }

  const { data: recipeIngredients } = await supabase
    .from("recipe_ingredients")
    .select("*")
    .eq("recipe_id", id);

  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("id, name, unit, unit_cost")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link href="/onboarding/recipes" className="text-sm text-neutral-500 hover:underline">
            ← Voltar para receitas
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{recipe.name}</h1>
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

      <RecipeDetailManager
        recipe={recipe}
        initialItems={recipeIngredients ?? []}
        availableIngredients={ingredients ?? []}
      />
    </div>
  );
}
