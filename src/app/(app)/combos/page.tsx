import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePlan } from "@/lib/subscription";
import { ComboManager, type ComboSummary } from "./ComboManager";
import { ComboLockScreen } from "./ComboLockScreen";
import { ScreenHeader } from "@/components/ScreenHeader";

export default async function CombosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const plan = await getEffectivePlan(supabase, user.id);

  if (!plan.hasCombos) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-4 sm:p-6">
        <ScreenHeader
          title="Combos"
          description="Monte combos com várias receitas do seu cardápio."
        />
        <ComboLockScreen />
      </div>
    );
  }

  const [{ data: combos }, { data: recipes }] = await Promise.all([
    supabase
      .from("combos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase.from("recipes").select("id, name").eq("user_id", user.id).order("name", { ascending: true }),
  ]);

  const comboIds = (combos ?? []).map((combo) => combo.id);
  const { data: comboRecipes } =
    comboIds.length > 0
      ? await supabase.from("combo_recipes").select("*").in("combo_id", comboIds)
      : { data: [] };

  const recipeNameById = new Map((recipes ?? []).map((r) => [r.id, r.name]));

  const summaries: ComboSummary[] = (combos ?? []).map((combo) => ({
    id: combo.id,
    name: combo.name,
    items: (comboRecipes ?? [])
      .filter((item) => item.combo_id === combo.id)
      .map((item) => ({
        id: item.id,
        recipeId: item.recipe_id,
        recipeName: recipeNameById.get(item.recipe_id) ?? "Receita removida",
        quantity: item.quantity,
      })),
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-4 sm:p-6">
      <ScreenHeader
        title="Combos"
        description="Monte combos com várias receitas do seu cardápio."
      />

      <ComboManager initialCombos={summaries} availableRecipes={recipes ?? []} />
    </div>
  );
}
