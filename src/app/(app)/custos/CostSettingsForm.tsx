"use client";

import Link from "next/link";
import { useState, useTransition, type SVGProps } from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type UseFormRegisterReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { costSettingsSchema, type CostSettingsInput } from "@/lib/validation/cost-settings";
import { saveCostSettings } from "./actions";
import { saveMonthlyRevenue } from "./monthly-revenue-actions";
import { Card } from "@/components/Card";
import { computeCurrentMarkup, getMarkupBenchmark, type MarkupBenchmark } from "@/lib/pricing";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { FixedCost } from "@/lib/types/database";

type Props = {
  defaultValues: CostSettingsInput;
  currentYear: number;
  viewYear: number;
  currentYearValues: (number | null)[];
  viewYearValues: (number | null)[];
};

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const MARKUP_BENCHMARK_COLOR: Record<MarkupBenchmark, string> = {
  excellent: "text-green-600 dark:text-green-500",
  good: "text-green-600 dark:text-green-500",
  medium: "text-amber-600 dark:text-amber-500",
  high: "text-red-600 dark:text-red-500",
};

const nameInputClass =
  "min-w-0 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100";

const valueInputClass =
  "w-full rounded-md border border-neutral-300 px-2 py-2 text-right text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100";

export function CostSettingsForm({
  defaultValues,
  currentYear,
  viewYear,
  currentYearValues,
  viewYearValues,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  // Sempre o ano corrente, editável — independe de qual ano está sendo visualizado abaixo.
  const [monthlyValues, setMonthlyValues] = useState<(number | null)[]>(currentYearValues);
  const isCurrentYearView = viewYear === currentYear;
  const displayedValues = isCurrentYearView ? monthlyValues : viewYearValues;

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

  const watchedValues = useWatch({ control, defaultValue: defaultValues });

  // Markup usa sempre o ano corrente, mesmo enquanto o bloco abaixo exibe outro ano.
  const filledCurrentYearValues = monthlyValues.filter((v): v is number => v !== null);
  const avgMonthlyRevenue =
    filledCurrentYearValues.length > 0
      ? filledCurrentYearValues.reduce((sum, v) => sum + v, 0) / filledCurrentYearValues.length
      : null;

  // Média/total exibidos no bloco refletem o ano sendo visualizado (pode ser histórico).
  const filledDisplayedValues = displayedValues.filter((v): v is number => v !== null);
  const totalDisplayedRevenue = filledDisplayedValues.reduce((sum, v) => sum + v, 0);
  const avgDisplayedRevenue =
    filledDisplayedValues.length > 0 ? totalDisplayedRevenue / filledDisplayedValues.length : null;

  const watchedFixedCosts: FixedCost[] = (watchedValues.fixed_costs ?? []).map((item) => ({
    name: item?.name ?? "",
    value: item?.value ?? 0,
  }));

  const currentMarkup = computeCurrentMarkup({
    fixed_costs: watchedFixedCosts,
    card_fee_pct: Number(watchedValues.card_fee_pct) || 0,
    packaging_pct: Number(watchedValues.packaging_pct) || 0,
    free_delivery_pct: defaultValues.free_delivery_pct,
    desired_profit_pct: Number(watchedValues.desired_profit_pct) || 0,
    avg_monthly_revenue: avgMonthlyRevenue,
  });
  const markupBenchmark = currentMarkup !== null ? getMarkupBenchmark(currentMarkup) : null;

  const handleMonthChange = (index: number, raw: string) => {
    setMonthlyValues((prev) => {
      const next = [...prev];
      next[index] = raw === "" ? null : Number(raw);
      return next;
    });
  };

  const onSubmit = (values: CostSettingsInput) => {
    setFeedback(null);
    startTransition(async () => {
      const [costResult, revenueResult] = await Promise.all([
        saveCostSettings({
          ...values,
          free_delivery_pct: defaultValues.free_delivery_pct,
          avg_monthly_revenue: avgMonthlyRevenue,
        }),
        saveMonthlyRevenue({ year: currentYear, values: monthlyValues }),
      ]);

      if (!costResult.success || !revenueResult.success) {
        setFeedback({
          type: "error",
          message: costResult.error ?? revenueResult.error ?? "Erro ao salvar.",
        });
        return;
      }
      setFeedback({ type: "success", message: "Configurações salvas com sucesso." });
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
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
          <ReadOnlyPercentField
            id="free_delivery_pct"
            label="Entrega grátis (%)"
            value={defaultValues.free_delivery_pct}
          />
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
        </Card>

        <Card title="Markup ideal" description="Base para o cálculo do markup ideal do seu cardápio.">
          <PercentField
            id="desired_profit_pct"
            label="Lucro desejado (%)"
            register={register("desired_profit_pct", { valueAsNumber: true })}
            error={errors.desired_profit_pct?.message}
          />

          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-[1fr_7rem] items-center gap-3 rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700">
              <span className="text-sm font-medium">Markup ideal</span>
              <span
                className={`text-right font-mono text-base ${markupBenchmark ? MARKUP_BENCHMARK_COLOR[markupBenchmark] : ""}`}
              >
                {currentMarkup !== null
                  ? formatNumber(currentMarkup, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "—"}
              </span>
            </div>
            {currentMarkup === null && (
              <p className="px-1 text-xs text-neutral-400">
                Preencha o faturamento anual abaixo para calcular o markup.
              </p>
            )}
          </div>
        </Card>

        <Card
          title="Faturamento anual"
          description="Informe o faturamento de cada mês para calcular a média usada no markup."
          className="lg:col-span-2"
          headerExtra={
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/custos?year=${viewYear - 1}`}
                className="rounded-md px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              >
                ← {viewYear - 1}
              </Link>
              <span className="text-sm font-medium">{viewYear}</span>
              {viewYear < currentYear ? (
                <Link
                  href={`/custos?year=${viewYear + 1}`}
                  className="rounded-md px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                >
                  {viewYear + 1} →
                </Link>
              ) : (
                <span className="px-2 py-1 text-sm text-neutral-300 dark:text-neutral-700">
                  {viewYear + 1} →
                </span>
              )}
            </div>
          }
        >
          {!isCurrentYearView && (
            <p className="rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:bg-neutral-900">
              Visualizando {viewYear} — somente leitura. O markup sempre usa o faturamento de{" "}
              {currentYear}.
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {MONTH_LABELS.map((label, index) => (
              <div key={label} className="flex flex-col gap-1">
                <label htmlFor={`month-${index}`} className="px-1 text-xs font-medium text-neutral-500">
                  {label}
                </label>
                <input
                  id={`month-${index}`}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="—"
                  disabled={!isCurrentYearView}
                  value={displayedValues[index] ?? ""}
                  onChange={
                    isCurrentYearView ? (e) => handleMonthChange(index, e.target.value) : undefined
                  }
                  className={`${valueInputClass} ${!isCurrentYearView ? "bg-neutral-50 text-neutral-500 dark:bg-neutral-900" : ""}`}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
            <div className="flex flex-col gap-1 rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700">
              <span className="text-xs text-neutral-500">Média mensal</span>
              <span className="font-mono text-base">
                {avgDisplayedRevenue !== null ? formatCurrency(avgDisplayedRevenue) : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700">
              <span className="text-xs text-neutral-500">Total faturado</span>
              <span className="font-mono text-base">{formatCurrency(totalDisplayedRevenue)}</span>
            </div>
          </div>

          {isCurrentYearView && avgDisplayedRevenue === null && (
            <p className="px-1 text-xs text-neutral-400">
              Sem dados ainda — restaurantes desse porte costumam faturar entre R$ 2.000 e R$
              10.000/mês. Preencha ao menos um mês para calcular sua média real.
            </p>
          )}
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

function ReadOnlyPercentField({
  id,
  label,
  value,
}: {
  id: string;
  label: string;
  value: number;
}) {
  return (
    <div className="grid grid-cols-[1fr_7rem] items-center gap-3 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
      <label htmlFor={id} className="text-sm font-medium text-neutral-500">
        {label}
        <Link
          href="/custo-motoboy"
          className="block text-xs font-normal text-neutral-400 underline-offset-2 hover:underline"
        >
          Preenchido em Custo Motoboy
        </Link>
      </label>
      <span id={id} className="text-right font-mono text-sm text-neutral-500">
        {value > 0 ? `${formatNumber(value, { maximumFractionDigits: 2 })}%` : "—"}
      </span>
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
