"use client";

import { useState, useTransition } from "react";
import { useFieldArray, useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { costSettingsSchema, type CostSettingsInput } from "@/lib/validation/cost-settings";
import { saveCostSettings } from "./actions";

type Props = {
  defaultValues: CostSettingsInput;
};

export function CostSettingsForm({ defaultValues }: Props) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CostSettingsInput>({
    resolver: zodResolver(costSettingsSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "fixed_costs",
  });

  const onSubmit = (values: CostSettingsInput) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await saveCostSettings(values);
      if (result.success) {
        setFeedback({ type: "success", message: "Configurações salvas com sucesso." });
      } else {
        setFeedback({ type: "error", message: result.error ?? "Erro ao salvar." });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10">
      {/* Custos fixos */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Custos fixos</h2>
          <p className="text-sm text-neutral-500">
            Aluguel, salários, contas... adicione quantos itens precisar.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {fields.length === 0 && (
            <p className="text-sm text-neutral-400">Nenhum custo fixo adicionado ainda.</p>
          )}

          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <div className="flex-1">
                <input
                  {...register(`fixed_costs.${index}.name`)}
                  placeholder="Nome (ex: Aluguel)"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
                />
                {errors.fixed_costs?.[index]?.name && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.fixed_costs[index]?.name?.message}
                  </p>
                )}
              </div>
              <div className="w-36">
                <input
                  {...register(`fixed_costs.${index}.value`, { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="R$ 0,00"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
                />
                {errors.fixed_costs?.[index]?.value && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.fixed_costs[index]?.value?.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
                aria-label="Remover custo fixo"
              >
                Remover
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => append({ name: "", value: 0 })}
          className="self-start rounded-md border border-dashed border-neutral-400 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          + Adicionar custo fixo
        </button>
      </section>

      {/* Custos variáveis */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Custos variáveis</h2>
          <p className="text-sm text-neutral-500">Percentuais aplicados sobre o preço de venda.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PercentField
            id="card_fee_pct"
            label="Taxa de cartão (%)"
            register={register("card_fee_pct", { valueAsNumber: true })}
            error={errors.card_fee_pct?.message}
          />
          <PercentField
            id="packaging_pct"
            label="Embalagem (%)"
            register={register("packaging_pct", { valueAsNumber: true })}
            error={errors.packaging_pct?.message}
          />
          <PercentField
            id="free_delivery_pct"
            label="Entrega grátis (%)"
            register={register("free_delivery_pct", { valueAsNumber: true })}
            error={errors.free_delivery_pct?.message}
          />
        </div>
      </section>

      {/* Lucro desejado */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Lucro desejado</h2>
          <p className="text-sm text-neutral-500">
            Base para o cálculo do markup ideal do seu cardápio.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PercentField
            id="desired_profit_pct"
            label="Lucro desejado (%)"
            register={register("desired_profit_pct", { valueAsNumber: true })}
            error={errors.desired_profit_pct?.message}
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="avg_monthly_revenue" className="text-sm font-medium">
              Faturamento médio mensal (opcional)
            </label>
            <input
              id="avg_monthly_revenue"
              type="number"
              step="0.01"
              min="0"
              placeholder="R$ 0,00"
              {...register("avg_monthly_revenue", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
            />
            <p className="text-xs text-neutral-400">
              Usado para estimar o markup quando ainda não há histórico de vendas.
            </p>
          </div>
        </div>
      </section>

      {feedback && (
        <p className={feedback.type === "success" ? "text-sm text-green-600" : "text-sm text-red-600"}>
          {feedback.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
      >
        {isPending ? "Salvando..." : "Salvar configurações"}
      </button>
    </form>
  );
}

function PercentField({
  id,
  label,
  register,
  error,
}: {
  id: string;
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="number"
        step="0.01"
        min="0"
        max="100"
        {...register}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
