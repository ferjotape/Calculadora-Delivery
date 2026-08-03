"use client";

import { useState, useTransition, type SVGProps } from "react";
import { useFieldArray, useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { costSettingsSchema, type CostSettingsInput } from "@/lib/validation/cost-settings";
import { saveCostSettings } from "./actions";
import { Card } from "@/components/Card";

type Props = {
  defaultValues: CostSettingsInput;
};

const nameInputClass =
  "min-w-0 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100";

const valueInputClass =
  "w-full rounded-md border border-neutral-300 px-2 py-2 text-right text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100";

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:grid-rows-[auto_auto] lg:gap-4">
        <Card
          title="Custos fixos"
          description="Aluguel, salários, contas... adicione quantos itens precisar."
          className="lg:row-span-2"
          footer={
            <button
              type="button"
              onClick={() => append({ name: "", value: 0 })}
              className="self-start rounded-md border border-dashed border-neutral-400 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              + Adicionar custo fixo
            </button>
          }
        >
          {fields.length === 0 && (
            <p className="text-sm text-neutral-400">Nenhum custo fixo adicionado ainda.</p>
          )}

          {fields.map((field, index) => {
            const nameError = errors.fixed_costs?.[index]?.name?.message;
            const valueError = errors.fixed_costs?.[index]?.value?.message;
            return (
              <div key={field.id} className="flex flex-col gap-1">
                <div className="grid grid-cols-[1fr_6rem_2.25rem] items-center gap-2 rounded-md border border-neutral-300 p-2 dark:border-neutral-700">
                  <input
                    {...register(`fixed_costs.${index}.name`)}
                    placeholder="Nome (ex: Aluguel)"
                    className={nameInputClass}
                  />
                  <input
                    {...register(`fixed_costs.${index}.value`, { valueAsNumber: true })}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="R$ 0,00"
                    className={valueInputClass}
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-300 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-900"
                    aria-label="Remover custo fixo"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                {(nameError || valueError) && (
                  <div className="flex flex-wrap gap-x-3 px-1 text-xs text-red-600">
                    {nameError && <span>{nameError}</span>}
                    {valueError && <span>{valueError}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </Card>

        <Card title="Custos variáveis" description="Percentuais aplicados sobre o preço de venda.">
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
        </Card>

        <Card title="Lucro desejado" description="Base para o cálculo do markup ideal do seu cardápio.">
          <PercentField
            id="desired_profit_pct"
            label="Lucro desejado (%)"
            register={register("desired_profit_pct", { valueAsNumber: true })}
            error={errors.desired_profit_pct?.message}
          />

          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-[1fr_7rem] items-center gap-3 rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700">
              <label htmlFor="avg_monthly_revenue" className="text-sm font-medium">
                Faturamento médio mensal (opcional)
              </label>
              <input
                id="avg_monthly_revenue"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="R$ 0,00"
                {...register("avg_monthly_revenue", {
                  setValueAs: (v) => (v === "" ? null : Number(v)),
                })}
                className={valueInputClass}
              />
            </div>
            <p className="px-1 text-xs text-neutral-400">
              Usado para estimar o markup quando ainda não há histórico de vendas.
            </p>
          </div>
        </Card>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-4 border-t border-neutral-200 pt-3 dark:border-neutral-800">
        {feedback ? (
          <p className={feedback.type === "success" ? "text-sm text-green-600" : "text-sm text-red-600"}>
            {feedback.message}
          </p>
        ) : (
          <span />
        )}

        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-active disabled:opacity-60"
        >
          {isPending ? "Salvando..." : "Salvar configurações"}
        </button>
      </div>
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
      <div className="grid grid-cols-[1fr_7rem] items-center gap-3 rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          max="100"
          {...register}
          className={valueInputClass}
        />
      </div>
      {error && <p className="px-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M4 6H16M8 6V4.5C8 4 8.4 3.5 9 3.5H11C11.6 3.5 12 4 12 4.5V6M14.5 6L14 15.5C14 16 13.6 16.5 13 16.5H7C6.4 16.5 6 16 6 15.5L5.5 6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
