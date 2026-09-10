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
import type { MonthlyRevenueRow } from "@/lib/monthly-revenue";

type Props = {
  defaultValues: DeliveryCostSettingsInput;
  latestMonth: MonthlyRevenueRow | null;
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

export function DeliveryCostForm({ defaultValues, latestMonth, year }: Props) {
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
  const monthlyOrders = Number(watchedValues.monthly_orders) || 0;
  const deliveryValue = Number(watchedValues.delivery_value) || 0;

  // Faturamento do mês mais recente preenchido em Faturamento Anual (nunca
  // uma média) ÷ nº de pedidos informado manualmente aqui.
  const ticketMedio =
    latestMonth !== null && monthlyOrders > 0 ? latestMonth.value / monthlyOrders : null;

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
          description="Faturamento do último mês preenchido dividido pelo nº de pedidos que você informar."
        >
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-[1fr_7rem] items-center gap-3 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
              <span className="text-sm font-medium text-neutral-500">Faturamento do último mês</span>
              <span className="text-right font-mono text-sm text-neutral-500">
                {latestMonth !== null ? formatCurrency(latestMonth.value) : "—"}
              </span>
            </div>
            {latestMonth !== null ? (
              <p className="px-1 text-xs text-neutral-400">
                Referente a {FULL_MONTH_NAMES[latestMonth.month - 1]}/{year}
              </p>
            ) : (
              <p className="px-1 text-xs text-neutral-400">
                Preencha o faturamento anual em{" "}
                <Link href="/custos" className="underline">
                  Configurações de custos
                </Link>
                .
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-[1fr_7rem] items-center gap-3 rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700">
              <label htmlFor="monthly_orders" className="text-sm font-medium">
                Nº de pedidos no mês
              </label>
              <input
                id="monthly_orders"
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                {...register("monthly_orders", { valueAsNumber: true })}
                className={valueInputClass}
              />
            </div>
            {errors.monthly_orders && (
              <p className="px-1 text-xs text-red-600">{errors.monthly_orders.message}</p>
            )}
          </div>

          <div className="rounded-md border border-accent/40 bg-accent/5 px-3 py-3">
            <span className="text-xs text-neutral-500">Ticket médio</span>
            <div className="font-mono text-2xl font-semibold">
              {ticketMedio !== null ? formatCurrency(ticketMedio) : "—"}
            </div>
            {ticketMedio === null && (
              <p className="mt-1 text-xs text-neutral-400">
                Preencha o faturamento anual e o nº de pedidos para calcular.
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
