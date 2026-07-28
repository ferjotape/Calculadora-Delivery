"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  addRecipeIngredient,
  removeRecipeIngredient,
  updateRecipe,
  updateRecipeIngredient,
} from "../actions";
import { formatCurrency, formatNumber } from "@/lib/format";
import { computeRecipePricing } from "@/lib/pricing";
import type { CostSettings, Recipe, RecipeIngredient } from "@/lib/types/database";

type IngredientOption = {
  id: string;
  name: string;
  unit: string;
  unit_cost: number;
};

type Props = {
  recipe: Recipe;
  initialItems: RecipeIngredient[];
  availableIngredients: IngredientOption[];
  costSettings: CostSettings | null;
};

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100";

export function RecipeDetailManager({
  recipe,
  initialItems,
  availableIngredients,
  costSettings,
}: Props) {
  const [recipeName, setRecipeName] = useState(recipe.name);
  const [lossPct, setLossPct] = useState(String(recipe.loss_pct));
  const [items, setItems] = useState<RecipeIngredient[]>(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [isSavingDetails, startSavingDetails] = useTransition();

  const ingredientsMap = useMemo(
    () => new Map(availableIngredients.map((i) => [i.id, i])),
    [availableIngredients]
  );

  const totalCost = useMemo(
    () =>
      items.reduce((sum, item) => {
        const unitCost = ingredientsMap.get(item.ingredient_id)?.unit_cost ?? 0;
        return sum + item.quantity_used * unitCost;
      }, 0),
    [items, ingredientsMap]
  );

  const pricing = useMemo(
    () =>
      computeRecipePricing({
        recipeCost: totalCost,
        lossPct: Number(lossPct) || 0,
        costSettings,
      }),
    [totalCost, lossPct, costSettings]
  );

  const saveDetails = () => {
    const loss = Number(lossPct);
    if (!recipeName.trim() || Number.isNaN(loss)) {
      setError("Informe o nome da receita e a % de perda.");
      return;
    }
    setError(null);
    startSavingDetails(async () => {
      const result = await updateRecipe(recipe.id, { name: recipeName.trim(), loss_pct: loss });
      if (!result.success) {
        setError(result.error ?? "Erro ao salvar a receita.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Detalhes da receita</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium">Nome do prato</label>
            <input
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div className="w-32">
            <label className="text-sm font-medium">% de perda</label>
            <input
              value={lossPct}
              onChange={(e) => setLossPct(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              max="100"
              className={`${inputClass} mt-1`}
            />
          </div>
          <button
            type="button"
            onClick={saveDetails}
            disabled={isSavingDetails}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
          >
            {isSavingDetails ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Insumos da receita</h2>
          <p className="text-sm text-neutral-500">
            Busque um insumo já cadastrado e informe a quantidade líquida usada.
          </p>
        </div>

        {availableIngredients.length === 0 ? (
          <p className="text-sm text-neutral-400">
            Você ainda não tem insumos cadastrados. Cadastre em &quot;Meus insumos&quot; antes de
            montar receitas.
          </p>
        ) : (
          <AddRecipeIngredientForm
            recipeId={recipe.id}
            availableIngredients={availableIngredients}
            onAdded={(item) => {
              setError(null);
              setItems((prev) => [...prev, item]);
            }}
            onError={setError}
          />
        )}

        <div className="flex flex-col gap-2">
          {items.length === 0 && (
            <p className="text-sm text-neutral-400">
              Nenhum insumo adicionado a esta receita ainda.
            </p>
          )}

          {items.map((item) => (
            <RecipeItemRow
              key={item.id}
              item={item}
              recipeId={recipe.id}
              ingredient={ingredientsMap.get(item.ingredient_id)}
              availableIngredients={availableIngredients}
              onUpdated={(updated) => {
                setError(null);
                setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
              }}
              onDeleted={(id) => {
                setError(null);
                setItems((prev) => prev.filter((i) => i.id !== id));
              }}
              onError={setError}
            />
          ))}
        </div>

        <div className="flex justify-end border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <p className="text-sm text-neutral-500">
            Custo total da receita:{" "}
            <span className="rounded-md bg-neutral-900 px-2 py-1 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900">
              {formatCurrency(totalCost)}
            </span>
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
        <div>
          <h2 className="text-lg font-semibold">Precificação sugerida</h2>
          <p className="text-sm text-neutral-500">
            Calculada a partir do custo dos insumos, da % de perda e das Configurações de Custos.
            Ainda não considera taxas de plataforma nem desconto.
          </p>
        </div>

        {pricing.issue === "no_cost_settings" && (
          <p className="text-sm text-amber-600 dark:text-amber-500">
            Configure seus custos em{" "}
            <Link href="/onboarding" className="underline">
              Configurações de Custos
            </Link>{" "}
            para calcular o preço sugerido.
          </p>
        )}
        {pricing.issue === "invalid_loss" && (
          <p className="text-sm text-red-600">A % de perda precisa ser menor que 100%.</p>
        )}
        {pricing.issue === "markup_exceeds_100" && (
          <p className="text-sm text-red-600">
            A soma dos custos fixos, variáveis e do lucro desejado ultrapassa 100% do preço de
            venda. Ajuste as{" "}
            <Link href="/onboarding" className="underline">
              Configurações de Custos
            </Link>
            .
          </p>
        )}
        {pricing.warning && (
          <p className="text-sm text-amber-600 dark:text-amber-500">{pricing.warning}</p>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Custo da receita" value={formatCurrency(totalCost)} />
          <Stat
            label="Custo com perda"
            value={pricing.costWithLoss !== null ? formatCurrency(pricing.costWithLoss) : "—"}
          />
          <Stat
            label="Preço sugerido"
            value={
              pricing.suggestedPrice !== null ? formatCurrency(pricing.suggestedPrice) : "—"
            }
            highlight
          />
          <Stat
            label="Lucro aproximado"
            value={
              pricing.approxProfitValue !== null && pricing.approxProfitPct !== null
                ? `${formatCurrency(pricing.approxProfitValue)} (${formatNumber(
                    pricing.approxProfitPct,
                    { minimumFractionDigits: 1, maximumFractionDigits: 1 }
                  )}%)`
                : "—"
            }
          />
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-neutral-500">{label}</span>
      <span className={highlight ? "text-2xl font-semibold" : "text-lg font-medium"}>{value}</span>
    </div>
  );
}

function IngredientPicker({
  ingredients,
  value,
  onChange,
}: {
  ingredients: IngredientOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const selected = ingredients.find((i) => i.id === value);
  const [query, setQuery] = useState(selected?.name ?? "");
  const [isOpen, setIsOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? ingredients.filter((i) => i.name.toLowerCase().includes(q)) : ingredients;
    return list.slice(0, 8);
  }, [ingredients, query]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          onChange("");
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder="Buscar insumo pelo nome..."
        className={inputClass}
      />
      {isOpen && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-neutral-300 bg-white text-sm shadow-md dark:border-neutral-700 dark:bg-neutral-900">
          {matches.map((ingredient) => (
            <li key={ingredient.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(ingredient.id);
                  setQuery(ingredient.name);
                  setIsOpen(false);
                }}
                className="block w-full px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                {ingredient.name}{" "}
                <span className="text-xs text-neutral-400">
                  ({formatCurrency(ingredient.unit_cost)} / {ingredient.unit})
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddRecipeIngredientForm({
  recipeId,
  availableIngredients,
  onAdded,
  onError,
}: {
  recipeId: string;
  availableIngredients: IngredientOption[];
  onAdded: (item: RecipeIngredient) => void;
  onError: (message: string) => void;
}) {
  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pickerKey, setPickerKey] = useState(0);

  const submit = () => {
    const qty = Number(quantity);
    if (!ingredientId || Number.isNaN(qty) || qty <= 0) {
      onError("Selecione um insumo e informe a quantidade usada.");
      return;
    }
    startTransition(async () => {
      const result = await addRecipeIngredient(recipeId, {
        ingredient_id: ingredientId,
        quantity_used: qty,
      });
      if (result.success && result.recipeIngredient) {
        onAdded(result.recipeIngredient);
        setIngredientId("");
        setQuantity("");
        setPickerKey((k) => k + 1);
      } else {
        onError(result.error ?? "Erro ao adicionar insumo.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <IngredientPicker
          key={pickerKey}
          ingredients={availableIngredients}
          value={ingredientId}
          onChange={setIngredientId}
        />
      </div>
      <div className="w-32">
        <input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          type="number"
          step="0.001"
          min="0"
          placeholder="Qtd. usada"
          className={inputClass}
        />
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
      >
        {isPending ? "Adicionando..." : "Adicionar"}
      </button>
    </div>
  );
}

function RecipeItemRow({
  item,
  recipeId,
  ingredient,
  availableIngredients,
  onUpdated,
  onDeleted,
  onError,
}: {
  item: RecipeIngredient;
  recipeId: string;
  ingredient?: IngredientOption;
  availableIngredients: IngredientOption[];
  onUpdated: (item: RecipeIngredient) => void;
  onDeleted: (id: string) => void;
  onError: (message: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [ingredientId, setIngredientId] = useState(item.ingredient_id);
  const [quantity, setQuantity] = useState(String(item.quantity_used));
  const [isPending, startTransition] = useTransition();

  const cancelEdit = () => {
    setIngredientId(item.ingredient_id);
    setQuantity(String(item.quantity_used));
    setIsEditing(false);
  };

  const save = () => {
    const qty = Number(quantity);
    if (!ingredientId || Number.isNaN(qty) || qty <= 0) {
      onError("Selecione um insumo e informe a quantidade usada.");
      return;
    }
    startTransition(async () => {
      const result = await updateRecipeIngredient(item.id, recipeId, {
        ingredient_id: ingredientId,
        quantity_used: qty,
      });
      if (result.success && result.recipeIngredient) {
        onUpdated(result.recipeIngredient);
        setIsEditing(false);
      } else {
        onError(result.error ?? "Erro ao salvar insumo.");
      }
    });
  };

  const remove = () => {
    if (!window.confirm("Remover este insumo da receita?")) {
      return;
    }
    startTransition(async () => {
      const result = await removeRecipeIngredient(item.id, recipeId);
      if (result.success) {
        onDeleted(item.id);
      } else {
        onError(result.error ?? "Erro ao remover insumo da receita.");
      }
    });
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-neutral-300 p-3 sm:flex-row sm:items-start dark:border-neutral-700">
        <div className="flex-1">
          <IngredientPicker
            ingredients={availableIngredients}
            value={ingredientId}
            onChange={setIngredientId}
          />
        </div>
        <div className="w-32">
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            type="number"
            step="0.001"
            min="0"
            className={inputClass}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            disabled={isPending}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  const lineCost = item.quantity_used * (ingredient?.unit_cost ?? 0);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-300 p-3 dark:border-neutral-700">
      <div>
        <p className="text-sm font-medium">{ingredient?.name ?? "Insumo removido"}</p>
        <p className="text-xs text-neutral-500">
          {formatNumber(item.quantity_used)} {ingredient?.unit ?? ""} ×{" "}
          {formatCurrency(ingredient?.unit_cost ?? 0)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
          {formatCurrency(lineCost)}
        </span>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={isPending}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          Remover
        </button>
      </div>
    </div>
  );
}
