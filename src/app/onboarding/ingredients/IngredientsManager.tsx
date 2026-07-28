"use client";

import { useMemo, useState, useTransition } from "react";
import { createIngredient, deleteIngredient, updateIngredient } from "./actions";
import { INGREDIENT_UNITS, type IngredientUnit } from "@/lib/validation/ingredient";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Ingredient } from "@/lib/types/database";

type Props = {
  initialIngredients: Ingredient[];
};

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100";

function estimateUnitCost(priceRaw: string, volumeRaw: string, factorRaw: string): number | null {
  const price = Number(priceRaw);
  const volume = Number(volumeRaw);
  const factor = Number(factorRaw);
  if (!volume || Number.isNaN(price) || Number.isNaN(volume) || Number.isNaN(factor)) {
    return null;
  }
  return (price / volume) * factor;
}

export function IngredientsManager({ initialIngredients }: Props) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return ingredients;
    return ingredients.filter((i) => i.name.toLowerCase().includes(query));
  }, [ingredients, search]);

  return (
    <div className="flex flex-col gap-6">
      <NewIngredientForm
        onCreated={(ingredient) => {
          setError(null);
          setIngredients((prev) => [...prev, ingredient]);
        }}
        onError={setError}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="search" className="text-sm font-medium">
            Buscar insumo
          </label>
          <input
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Digite o nome do insumo..."
            className={`${inputClass} mt-1`}
          />
        </div>

        {ingredients.length === 0 && (
          <p className="text-sm text-neutral-400">Nenhum insumo cadastrado ainda.</p>
        )}

        {ingredients.length > 0 && filtered.length === 0 && (
          <p className="text-sm text-neutral-400">Nenhum insumo encontrado para &quot;{search}&quot;.</p>
        )}

        {filtered.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                  <th className="px-3 py-2 font-medium">Cód.</th>
                  <th className="px-3 py-2 font-medium">Nome</th>
                  <th className="px-3 py-2 font-medium">Valor pago</th>
                  <th className="px-3 py-2 font-medium">Volume</th>
                  <th className="px-3 py-2 font-medium">Unidade</th>
                  <th className="px-3 py-2 font-medium">Fator correção</th>
                  <th className="px-3 py-2 font-medium">Custo unitário</th>
                  <th className="px-3 py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ingredient) => (
                  <IngredientRow
                    key={ingredient.id}
                    ingredient={ingredient}
                    onUpdated={(updated) => {
                      setError(null);
                      setIngredients((prev) =>
                        prev.map((i) => (i.id === updated.id ? updated : i))
                      );
                    }}
                    onDeleted={(id) => {
                      setError(null);
                      setIngredients((prev) => prev.filter((i) => i.id !== id));
                    }}
                    onError={setError}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function NewIngredientForm({
  onCreated,
  onError,
}: {
  onCreated: (ingredient: Ingredient) => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [pricePaid, setPricePaid] = useState("");
  const [purchaseVolume, setPurchaseVolume] = useState("");
  const [unit, setUnit] = useState<IngredientUnit>("kg");
  const [correctionFactor, setCorrectionFactor] = useState("1.00");
  const [isPending, startTransition] = useTransition();

  const preview = estimateUnitCost(pricePaid, purchaseVolume, correctionFactor);

  const submit = () => {
    const price = Number(pricePaid);
    const volume = Number(purchaseVolume);
    const factor = Number(correctionFactor);

    if (!name.trim() || Number.isNaN(price) || !volume || Number.isNaN(factor)) {
      onError("Preencha nome, valor pago, volume comprado e fator de correção corretamente.");
      return;
    }

    startTransition(async () => {
      const result = await createIngredient({
        name: name.trim(),
        price_paid: price,
        purchase_volume: volume,
        unit,
        correction_factor: factor,
      });
      if (result.success && result.ingredient) {
        onCreated(result.ingredient);
        setName("");
        setPricePaid("");
        setPurchaseVolume("");
        setUnit("kg");
        setCorrectionFactor("1.00");
      } else {
        onError(result.error ?? "Erro ao adicionar insumo.");
      }
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">Adicionar insumo</h2>
        <p className="text-sm text-neutral-500">
          Cadastre o insumo com o valor pago e o volume comprado para calcular o custo unitário
          automaticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label className="text-sm font-medium">Nome do insumo</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Filé de frango"
            className={`${inputClass} mt-1`}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Valor pago (R$)</label>
          <input
            value={pricePaid}
            onChange={(e) => setPricePaid(e.target.value)}
            type="number"
            step="0.01"
            min="0"
            placeholder="R$ 0,00"
            className={`${inputClass} mt-1`}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Volume comprado</label>
          <input
            value={purchaseVolume}
            onChange={(e) => setPurchaseVolume(e.target.value)}
            type="number"
            step="0.001"
            min="0"
            placeholder="0"
            className={`${inputClass} mt-1`}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Unidade</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as IngredientUnit)}
            className={`${inputClass} mt-1`}
          >
            {INGREDIENT_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="text-sm font-medium">Fator de correção</label>
          <input
            value={correctionFactor}
            onChange={(e) => setCorrectionFactor(e.target.value)}
            type="number"
            step="0.01"
            min="0.01"
            className={`${inputClass} mt-1`}
          />
          <p className="mt-1 text-xs text-neutral-400">
            Ajusta o custo pela perda/quebra do insumo (descasque, evaporação etc.). Deixe em 1,00
            se não houver perda.
          </p>
        </div>

        <div className="flex flex-col justify-end lg:col-span-2">
          <p className="text-sm text-neutral-500">
            Custo unitário estimado:{" "}
            <span className="rounded-md bg-neutral-900 px-2 py-1 text-xs font-semibold text-white dark:bg-white dark:text-neutral-900">
              {preview !== null ? `${formatCurrency(preview)} / ${unit}` : "—"}
            </span>
          </p>
        </div>

        <div className="flex items-end lg:col-span-2 lg:justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 sm:w-auto dark:bg-white dark:text-neutral-900"
          >
            {isPending ? "Adicionando..." : "Adicionar insumo"}
          </button>
        </div>
      </div>
    </section>
  );
}

function IngredientRow({
  ingredient,
  onUpdated,
  onDeleted,
  onError,
}: {
  ingredient: Ingredient;
  onUpdated: (ingredient: Ingredient) => void;
  onDeleted: (id: string) => void;
  onError: (message: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(ingredient.name);
  const [pricePaid, setPricePaid] = useState(String(ingredient.price_paid));
  const [purchaseVolume, setPurchaseVolume] = useState(String(ingredient.purchase_volume));
  const [unit, setUnit] = useState<IngredientUnit>(ingredient.unit as IngredientUnit);
  const [correctionFactor, setCorrectionFactor] = useState(String(ingredient.correction_factor));
  const [isPending, startTransition] = useTransition();

  const cancelEdit = () => {
    setName(ingredient.name);
    setPricePaid(String(ingredient.price_paid));
    setPurchaseVolume(String(ingredient.purchase_volume));
    setUnit(ingredient.unit as IngredientUnit);
    setCorrectionFactor(String(ingredient.correction_factor));
    setIsEditing(false);
  };

  const save = () => {
    const price = Number(pricePaid);
    const volume = Number(purchaseVolume);
    const factor = Number(correctionFactor);

    if (!name.trim() || Number.isNaN(price) || !volume || Number.isNaN(factor)) {
      onError("Preencha nome, valor pago, volume comprado e fator de correção corretamente.");
      return;
    }

    startTransition(async () => {
      const result = await updateIngredient(ingredient.id, {
        name: name.trim(),
        price_paid: price,
        purchase_volume: volume,
        unit,
        correction_factor: factor,
      });
      if (result.success && result.ingredient) {
        onUpdated(result.ingredient);
        setIsEditing(false);
      } else {
        onError(result.error ?? "Erro ao salvar insumo.");
      }
    });
  };

  const remove = () => {
    if (!window.confirm(`Remover o insumo "${ingredient.name}"?`)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteIngredient(ingredient.id);
      if (result.success) {
        onDeleted(ingredient.id);
      } else {
        onError(result.error ?? "Erro ao remover insumo.");
      }
    });
  };

  if (isEditing) {
    const preview = estimateUnitCost(pricePaid, purchaseVolume, correctionFactor);
    return (
      <tr className="border-b border-neutral-200 align-top dark:border-neutral-800">
        <td className="px-3 py-2 text-neutral-400">{ingredient.code ?? "—"}</td>
        <td className="px-3 py-2">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </td>
        <td className="px-3 py-2">
          <input
            value={pricePaid}
            onChange={(e) => setPricePaid(e.target.value)}
            type="number"
            step="0.01"
            min="0"
            className={`${inputClass} w-28`}
          />
        </td>
        <td className="px-3 py-2">
          <input
            value={purchaseVolume}
            onChange={(e) => setPurchaseVolume(e.target.value)}
            type="number"
            step="0.001"
            min="0"
            className={`${inputClass} w-24`}
          />
        </td>
        <td className="px-3 py-2">
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as IngredientUnit)}
            className={`${inputClass} w-20`}
          >
            {INGREDIENT_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2">
          <input
            value={correctionFactor}
            onChange={(e) => setCorrectionFactor(e.target.value)}
            type="number"
            step="0.01"
            min="0.01"
            className={`${inputClass} w-20`}
          />
        </td>
        <td className="px-3 py-2 text-xs text-neutral-500">
          {preview !== null ? `${formatCurrency(preview)} / ${unit}` : "—"}
        </td>
        <td className="px-3 py-2">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={isPending}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              Cancelar
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-neutral-200 dark:border-neutral-800">
      <td className="px-3 py-2 text-neutral-400">{ingredient.code ?? "—"}</td>
      <td className="px-3 py-2 font-medium">{ingredient.name}</td>
      <td className="px-3 py-2">{formatCurrency(ingredient.price_paid)}</td>
      <td className="px-3 py-2">{formatNumber(ingredient.purchase_volume)}</td>
      <td className="px-3 py-2 text-neutral-500">{ingredient.unit}</td>
      <td className="px-3 py-2 text-neutral-500">
        {formatNumber(ingredient.correction_factor, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </td>
      <td className="px-3 py-2">
        <span className="rounded-md bg-neutral-900 px-2 py-1 text-xs font-semibold text-white dark:bg-white dark:text-neutral-900">
          {formatCurrency(ingredient.unit_cost)} / {ingredient.unit}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-2">
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
      </td>
    </tr>
  );
}
