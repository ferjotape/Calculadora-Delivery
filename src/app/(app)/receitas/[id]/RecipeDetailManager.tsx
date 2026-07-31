"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  addRecipeIngredient,
  removeRecipeIngredient,
  syncRecipePlatformPrices,
  updateRecipe,
  updateRecipeIngredient,
} from "../actions";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  applyDiscount,
  computePlatformPrice,
  computePriceMetrics,
  computeRecipePricing,
  getPracticedPriceStatus,
  REVENUE_BELOW_FIXED_COSTS_WARNING,
  type PracticedPriceStatus,
} from "@/lib/pricing";
import type { CostSettings, Recipe, RecipeIngredient } from "@/lib/types/database";

type IngredientOption = {
  id: string;
  name: string;
  unit: string;
  unit_cost: number;
};

type PlatformOption = {
  id: string;
  name: string;
  fee_pct: number;
};

type Props = {
  recipe: Recipe;
  initialItems: RecipeIngredient[];
  availableIngredients: IngredientOption[];
  costSettings: CostSettings | null;
  platforms: PlatformOption[];
};

const PRACTICED_PRICE_STATUS_STYLES: Record<
  PracticedPriceStatus,
  { label: string; className: string }
> = {
  below: { label: "abaixo do preço sugerido", className: "text-red-600 dark:text-red-500" },
  equal: { label: "alinhado ao preço sugerido", className: "text-green-600 dark:text-green-500" },
  above: { label: "acima do preço sugerido", className: "text-amber-600 dark:text-amber-500" },
};

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100";

export function RecipeDetailManager({
  recipe,
  initialItems,
  availableIngredients,
  costSettings,
  platforms,
}: Props) {
  const [recipeName, setRecipeName] = useState(recipe.name);
  const [lossPct, setLossPct] = useState(String(recipe.loss_pct));
  const [discountPct, setDiscountPct] = useState(String(recipe.discount_pct));
  const [practicedPrice, setPracticedPrice] = useState(
    recipe.practiced_price !== null ? String(recipe.practiced_price) : ""
  );
  const [items, setItems] = useState<RecipeIngredient[]>(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [isSavingDetails, startSavingDetails] = useTransition();
  const syncedOnMountRef = useRef(false);

  useEffect(() => {
    if (syncedOnMountRef.current) return;
    syncedOnMountRef.current = true;
    void syncRecipePlatformPrices(recipe.id).catch(() => {});
  }, [recipe.id]);

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

  const discountPctNumber = Number(discountPct) || 0;

  const suggestedPriceWithDiscount = useMemo(() => {
    if (discountPctNumber <= 0 || pricing.suggestedPrice === null) return null;
    return applyDiscount(pricing.suggestedPrice, discountPctNumber);
  }, [discountPctNumber, pricing.suggestedPrice]);

  const discountedMetrics = useMemo(() => {
    if (suggestedPriceWithDiscount === null || pricing.costWithLoss === null) return null;
    return computePriceMetrics(suggestedPriceWithDiscount, pricing.costWithLoss, pricing.variablePct);
  }, [suggestedPriceWithDiscount, pricing.costWithLoss, pricing.variablePct]);

  const platformRows = useMemo(() => {
    const { suggestedPrice, costWithLoss, variablePct } = pricing;
    if (suggestedPrice === null || costWithLoss === null) return [];

    return platforms.map((platform) => {
      const price = computePlatformPrice(suggestedPrice, platform.fee_pct);
      if (price === null) {
        return { platform, price: null, priceWithDiscount: null, metrics: null };
      }
      const priceWithDiscount = discountPctNumber > 0 ? applyDiscount(price, discountPctNumber) : null;
      const effectivePrice = priceWithDiscount ?? price;
      const metrics = computePriceMetrics(effectivePrice, costWithLoss, variablePct);
      return { platform, price, priceWithDiscount, metrics };
    });
  }, [platforms, pricing, discountPctNumber]);

  const practicedPriceNumber = practicedPrice.trim() === "" ? null : Number(practicedPrice);
  const practicedPriceStatus =
    practicedPriceNumber !== null &&
    !Number.isNaN(practicedPriceNumber) &&
    pricing.suggestedPrice !== null
      ? getPracticedPriceStatus(practicedPriceNumber, pricing.suggestedPrice)
      : null;

  const saveDetails = () => {
    const loss = Number(lossPct);
    const discount = Number(discountPct);
    if (!recipeName.trim() || Number.isNaN(loss) || Number.isNaN(discount)) {
      setError("Informe o nome da receita, a % de perda e o desconto corretamente.");
      return;
    }
    if (practicedPrice.trim() !== "" && Number.isNaN(Number(practicedPrice))) {
      setError("Informe um preço praticado válido.");
      return;
    }
    setError(null);
    startSavingDetails(async () => {
      const result = await updateRecipe(recipe.id, {
        name: recipeName.trim(),
        loss_pct: loss,
        discount_pct: discount,
        practiced_price: practicedPrice.trim() === "" ? null : Number(practicedPrice),
      });
      if (!result.success) {
        setError(result.error ?? "Erro ao salvar a receita.");
        return;
      }
      void syncRecipePlatformPrices(recipe.id).catch(() => {});
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg">Detalhes da receita</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="text-sm font-medium">Nome do prato</label>
            <input
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div>
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
          <div>
            <label className="text-sm font-medium">Desconto/promoção (%)</label>
            <input
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              max="100"
              className={`${inputClass} mt-1`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="text-sm font-medium">Preço praticado (R$)</label>
            <input
              value={practicedPrice}
              onChange={(e) => setPracticedPrice(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              placeholder="Opcional"
              className={`${inputClass} mt-1`}
            />
            {practicedPriceStatus && (
              <p
                className={`mt-1 text-xs font-medium ${PRACTICED_PRICE_STATUS_STYLES[practicedPriceStatus].className}`}
              >
                {PRACTICED_PRICE_STATUS_STYLES[practicedPriceStatus].label}
              </p>
            )}
          </div>
          <div className="flex items-end lg:col-span-2 lg:justify-end">
            <button
              type="button"
              onClick={saveDetails}
              disabled={isSavingDetails}
              className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-active disabled:opacity-60 sm:w-auto"
            >
              {isSavingDetails ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg">Insumos da receita</h2>
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
            <span className="rounded-md bg-neutral-900 px-2 py-1 font-mono text-sm font-semibold text-white dark:bg-white dark:text-neutral-900">
              {formatCurrency(totalCost)}
            </span>
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
        <div>
          <h2 className="text-lg">Precificação sugerida</h2>
          <p className="text-sm text-neutral-500">
            Calculada a partir do custo dos insumos, da % de perda e das Configurações de Custos
            (sem taxa de plataforma).
          </p>
        </div>

        {pricing.issue === "no_cost_settings" && (
          <p className="text-sm text-amber-600 dark:text-amber-500">
            Configure seus custos em{" "}
            <Link href="/custos" className="underline">
              Configurações de Custos
            </Link>{" "}
            para calcular o preço sugerido.
          </p>
        )}
        {pricing.issue === "invalid_loss" && (
          <p className="text-sm text-red-600">A % de perda precisa ser menor que 100%.</p>
        )}
        {pricing.issue === "revenue_below_fixed_costs" && (
          <p className="text-sm text-red-600">{REVENUE_BELOW_FIXED_COSTS_WARNING}</p>
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

        {discountPctNumber > 0 && suggestedPriceWithDiscount !== null && discountedMetrics && (
          <div className="grid grid-cols-2 gap-4 border-t border-neutral-200 pt-4 sm:grid-cols-4 dark:border-neutral-800">
            <Stat
              label={`Preço com desconto (${formatNumber(discountPctNumber)}%)`}
              value={formatCurrency(suggestedPriceWithDiscount)}
              highlight
            />
            <Stat
              label="Lucro com desconto"
              value={`${formatCurrency(discountedMetrics.profitValue)} (${formatNumber(
                discountedMetrics.profitPct,
                { minimumFractionDigits: 1, maximumFractionDigits: 1 }
              )}%)`}
            />
            <Stat
              label="CMV com desconto"
              value={`${formatNumber(discountedMetrics.cmvPct, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}%`}
            />
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg">Preço por plataforma</h2>
          <p className="text-sm text-neutral-500">
            Preço para que, descontada a taxa de cada plataforma ativa, sobre o preço sugerido.
          </p>
        </div>

        {pricing.suggestedPrice === null ? (
          <p className="text-sm text-neutral-400">
            Calcule o preço sugerido acima para ver o preço por plataforma.
          </p>
        ) : platforms.length === 0 ? (
          <p className="text-sm text-neutral-400">
            Nenhuma plataforma ativa cadastrada.{" "}
            <Link href="/plataformas" className="underline">
              Cadastre suas plataformas de delivery
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                  <th className="px-3 py-2 font-medium">Plataforma</th>
                  <th className="px-3 py-2 font-medium">Taxa</th>
                  <th className="px-3 py-2 font-medium">Preço sugerido</th>
                  {discountPctNumber > 0 && (
                    <th className="px-3 py-2 font-medium">Preço com desconto</th>
                  )}
                  <th className="px-3 py-2 font-medium">Lucro</th>
                  <th className="px-3 py-2 font-medium">CMV</th>
                </tr>
              </thead>
              <tbody>
                {platformRows.map(({ platform, price, priceWithDiscount, metrics }) => (
                  <tr
                    key={platform.id}
                    className="border-b border-neutral-200 last:border-b-0 dark:border-neutral-800"
                  >
                    <td className="px-3 py-2 font-medium">{platform.name}</td>
                    <td className="px-3 py-2 font-mono text-neutral-500">
                      {formatNumber(platform.fee_pct)}%
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {price !== null ? formatCurrency(price) : "—"}
                    </td>
                    {discountPctNumber > 0 && (
                      <td className="px-3 py-2 font-mono">
                        {priceWithDiscount !== null ? formatCurrency(priceWithDiscount) : "—"}
                      </td>
                    )}
                    <td className="px-3 py-2 font-mono">
                      {metrics
                        ? `${formatCurrency(metrics.profitValue)} (${formatNumber(
                            metrics.profitPct,
                            { minimumFractionDigits: 1, maximumFractionDigits: 1 }
                          )}%)`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-neutral-500">
                      {metrics
                        ? `${formatNumber(metrics.cmvPct, {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
      <span
        className={
          highlight ? "font-mono text-2xl font-semibold" : "font-mono text-lg font-medium"
        }
      >
        {value}
      </span>
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
        void syncRecipePlatformPrices(recipeId).catch(() => {});
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
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-active disabled:opacity-60"
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
        void syncRecipePlatformPrices(recipeId).catch(() => {});
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
        void syncRecipePlatformPrices(recipeId).catch(() => {});
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
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-active disabled:opacity-60"
          >
            {isPending ? "Salvando..." : "Salvar"}
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
        <span className="rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
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
          {isPending ? "Removendo..." : "Remover"}
        </button>
      </div>
    </div>
  );
}
