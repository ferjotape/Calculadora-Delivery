import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionStatus } from "@/lib/subscription";
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

  const subscriptionStatus = await getSubscriptionStatus(supabase, user.id);
  if (!subscriptionStatus.isActive) {
    redirect("/billing");
  }

  const [
    { data: recipe },
    { data: recipeIngredients },
    { data: ingredients },
    { data: costSettings },
    { data: platforms },
  ] = await Promise.all([
    supabase.from("recipes").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("recipe_ingredients").select("*").eq("recipe_id", id),
    supabase
      .from("ingredients")
      .select("id, name, unit, unit_cost")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase.from("cost_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("delivery_platforms")
      .select("id, name, fee_pct")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  if (!recipe) {
    redirect("/receitas");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-12">
      <div>
        <Link href="/receitas" className="text-sm text-neutral-500 hover:underline">
          ← Voltar para receitas
        </Link>
        <h1 className="mt-2 text-2xl">{recipe.name}</h1>
      </div>

      <RecipeDetailManager
        recipe={recipe}
        initialItems={recipeIngredients ?? []}
        availableIngredients={ingredients ?? []}
        costSettings={costSettings ?? null}
        platforms={platforms ?? []}
      />
    </div>
  );
}
