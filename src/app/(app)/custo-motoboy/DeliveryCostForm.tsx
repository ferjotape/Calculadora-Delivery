"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  deliveryCostSettingsSchema,
  type DeliveryCostSettingsInput,
} from "@/lib/validation/delivery-cost-settings";
import { saveDeliveryCostSettings } from "./actions";
import { Card } from "@/components/Card";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { MonthlyRevenueOrdersRow } from "@/lib/monthly-revenue";

type Props = {
  defaultValues: DeliveryCostSettingsInput;
  referenceMonth: MonthlyRevenueOrdersRow | null;
  year: number;
};

const valueInputClass =
  "w-full rounded-md border border-neutral-300 px-2 py-2 text-right text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100";

const FULL_MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function DeliveryCostForm({ defaultValues, referenceMonth, year }: Props) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DeliveryCostSettingsInput>({
    resolver: zodResolver(deliveryCostSettingsSchema),
    defaultValues,
  });

  const watchedValues = useWatch({ control, defaultValue: defaultValues });
  const deliveryValue = Number(watchedValues.delivery_value) || 0;

  // Faturamento e nº de pedidos SEMPRE do mesmo mês (o mais recente com os
  // dois preenchidos) — nunca uma média de vários meses, nunca um mês
  // misturado com pedidos de outro.
  const ticketMedio =
    referenceMonth !== null && referenceMonth.orders_count
      ? referenceMonth.value / referenceMonth.orders_count
      : null;

  const freeDeliveryPct =
    ticketMedio !== null && ticketMedio > 0 ? (deliveryValue / ticketMedio) * 100 : null;

  const onSubmit = (values: DeliveryCostSettingsInput) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await saveDeliveryCostSettings(values);
      if (result.success) {
        setFeedback({ type: "success", message: "Configurações salvas com sucesso." });
      } else {
        setFeedback({ type: "error", message: result.error ?? "Erro ao salvar." });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        <Card
          title="Ticket médio"
          description="Faturamento do mês mais recente dividido pelo nº de pedidos do MESMO mês — nunca uma média de vários meses."
        >
          <div className="rounded-md border border-accent/40 bg-accent/5 px-3 py-3">
            <span className="text-xs text-neutral-500">Ticket médio</span>
            <div className="font-mono text-2xl font-semibold">
              {ticketMedio !== null ? formatCurrency(ticketMedio) : "—"}
            </div>
            {referenceMonth !== null ? (
              <p className="mt-1 text-xs text-neutral-500">
                Baseado em {FULL_MONTH_NAMES[referenceMonth.month - 1]}/{year} —{" "}
                {formatCurrency(referenceMonth.value)} /{" "}
                {formatNumber(referenceMonth.orders_count ?? 0, { maximumFractionDigits: 0 })}{" "}
                pedidos
              </p>
            ) : (
              <p className="mt-1 text-xs text-neutral-400">
                Preencha o faturamento e o nº de pedidos de pelo menos um mês em{" "}
                <Link href="/custos" className="underline">
                  Configurações de Custos
                </Link>
                , na aba Faturamento anual.
              </p>
            )}
          </div>
        </Card>

        <Card
          title="Custo entrega grátis"
          description="Custo da entrega bancada pelo restaurante no programa de entrega grátis."
        >
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-[1fr_7rem] items-center gap-3 rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700">
              <label htmlFor="delivery_value" className="text-sm font-medium">
                Valor entrega
              </label>
              <input
                id="delivery_value"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="R$ 0,00"
                {...register("delivery_value", { valueAsNumber: true })}
                className={valueInputClass}
              />
            </div>
            {errors.delivery_value && (
              <p className="px-1 text-xs text-red-600">{errors.delivery_value.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-[1fr_7rem] items-center gap-3 rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700">
              <span className="text-sm font-medium">% Custo variável</span>
              <span className="text-right font-mono text-sm">
                {freeDeliveryPct !== null
                  ? `${formatNumber(freeDeliveryPct, { maximumFractionDigits: 2 })}%`
                  : "—"}
              </span>
            </div>
            {freeDeliveryPct === null && (
              <p className="px-1 text-xs text-neutral-400">
                Preencha o Custo Motoboy para calcular.
              </p>
            )}
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
