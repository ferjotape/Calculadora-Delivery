"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createRecipe, deleteRecipe } from "./actions";
import { formatCurrency } from "@/lib/format";

export type RecipeSummary = {
  id: string;
  name: string;
  loss_pct: number;
  totalCost: number;
  ingredientCount: number;
};

type Props = {
  initialRecipes: RecipeSummary[];
};

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100";

export function RecipesManager({ initialRecipes }: Props) {
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipeSummary[]>(initialRecipes);
  const [name, setName] = useState("");
  const [lossPct, setLossPct] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    const loss = Number(lossPct);
    if (!name.trim() || Number.isNaN(loss)) {
      setError("Informe o nome da receita e a % de perda.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createRecipe({ name: name.trim(), loss_pct: loss });
      if (result.success && result.recipe) {
        router.push(`/onboarding/recipes/${result.recipe.id}`);
      } else {
        setError(result.error ?? "Erro ao criar receita.");
      }
    });
  };

  const remove = (recipe: RecipeSummary) => {
    if (
      !window.confirm(
        `Remover a receita "${recipe.name}"? Os insumos vinculados a ela também serão removidos.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteRecipe(recipe.id);
      if (result.success) {
        setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
      } else {
        setError(result.error ?? "Erro ao remover receita.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Nova receita</h2>
          <p className="text-sm text-neutral-500">
            Depois de criar, você adiciona os insumos e as quantidades usadas.
          </p>
        </div>

        <div className="flex items-start gap-2">
          <div className="flex-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do prato (ex: Marmita de frango)"
              className={inputClass}
            />
          </div>
          <div className="w-32">
            <input
              value={lossPct}
              onChange={(e) => setLossPct(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="% perda"
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
          >
            {isPending ? "Criando..." : "Criar receita"}
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-2">
        {recipes.length === 0 && (
          <p className="text-sm text-neutral-400">Nenhuma receita cadastrada ainda.</p>
        )}

        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-300 p-3 dark:border-neutral-700"
          >
            <div>
              <p className="text-sm font-medium">{recipe.name}</p>
              <p className="text-xs text-neutral-500">
                {recipe.ingredientCount} insumo(s) · {recipe.loss_pct}% de perda
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-md bg-neutral-900 px-2 py-1 text-xs font-semibold text-white dark:bg-white dark:text-neutral-900">
                {formatCurrency(recipe.totalCost)}
              </span>
              <Link
                href={`/onboarding/recipes/${recipe.id}`}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
              >
                Abrir
              </Link>
              <button
                type="button"
                onClick={() => remove(recipe)}
                disabled={isPending}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
