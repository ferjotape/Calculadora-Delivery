"use client";

import { useMemo, useState, useTransition } from "react";
import { updateComboPricing } from "../actions";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  computeComboMinPrice,
  computeComboPromoPrice,
  computeComboRecommendedPrice,
  computePlatformPrice,
  computePriceMetrics,
  resolveSafetyMarginPct,
  type ComboSafetyMarginType,
} from "@/lib/pricing";
import type { ComboRecipeLine } from "../comboData";
import type { Combo, CostSettings } from "@/lib/types/database";
import { Card } from "@/components/Card";

type PlatformOption = {
  id: string;
  name: string;
  fee_pct: number;
};

type Props = {
  combo: Combo;
  lines: ComboRecipeLine[];
  totalCost: number;
  summedPrice: number;
  costSettings: CostSettings | null;
  hasIssue: boolean;
  platforms: PlatformOption[];
};

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100";

const MARGIN_OPTIONS: { type: ComboSafetyMarginType; label: string }[] = [
  { type: "5", label: "5%" },
  { type: "10", label: "10%" },
  { type: "custom", label: "Personalizado" },
];

export function ComboDetailManager({
  combo,
  lines,
  totalCost,
  summedPrice,
  costSettings,
  hasIssue,
  platforms,
}: Props) {
  const [safetyMarginType, setSafetyMarginType] = useState<ComboSafetyMarginType>(
    combo.safety_margin_type
  );
  const [safetyMarginCustomPct, setSafetyMarginCustomPct] = useState(
    combo.safety_margin_custom_pct !== null ? String(combo.safety_margin_custom_pct) : ""
  );
  const [promoDiscountPct, setPromoDiscountPct] = useState(String(combo.promo_discount_pct));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const recommendedResult = useMemo(
    () => computeComboRecommendedPrice(summedPrice, totalCost, costSettings),
    [summedPrice, totalCost, costSettings]
  );

  const [practicedPrice, setPracticedPrice] = useState(
    combo.practiced_price !== null
      ? String(combo.practiced_price)
      : recommendedResult.recommended > 0
        ? recommendedResult.recommended.toFixed(2)
        : ""
  );

  const safetyMarginCustomNum = Number(safetyMarginCustomPct) || 0;
  const safetyMarginPct = resolveSafetyMarginPct(
    safetyMarginType,
    safetyMarginType === "custom" ? safetyMarginCustomNum : null
  );

  const minPriceResult = useMemo(
    () => computeComboMinPrice(totalCost, costSettings, safetyMarginPct),
    [totalCost, costSettings, safetyMarginPct]
  );

  const promoDiscountNum = Number(promoDiscountPct) || 0;
  const promoResult = useMemo(
    () => computeComboPromoPrice(recommendedResult.recommended, minPriceResult.minPrice, promoDiscountNum),
    [recommendedResult.recommended, minPriceResult.minPrice, promoDiscountNum]
  );

  const practicedPriceNum = Number(practicedPrice);
  const practicedPriceValid = practicedPrice.trim() !== "" && !Number.isNaN(practicedPriceNum);
  const practicedPriceBelowMin =
    practicedPriceValid && minPriceResult.minPrice !== null && practicedPriceNum < minPriceResult.minPrice;

  const economia = practicedPriceValid ? summedPrice - practicedPriceNum : null;

  const profitMetrics = useMemo(() => {
    if (!practicedPriceValid) return null;
    return computePriceMetrics(practicedPriceNum, totalCost, minPriceResult.variablePct);
  }, [practicedPriceValid, practicedPriceNum, totalCost, minPriceResult.variablePct]);

  const platformRows = useMemo(
    () =>
      platforms.map((platform) => ({
        platform,
        min: minPriceResult.minPrice !== null ? computePlatformPrice(minPriceResult.minPrice, platform.fee_pct) : null,
        recommended: computePlatformPrice(recommendedResult.recommended, platform.fee_pct),
        promo: computePlatformPrice(promoResult.price, platform.fee_pct),
      })),
    [platforms, minPriceResult.minPrice, recommendedResult.recommended, promoResult.price]
  );

  const save = () => {
    setSaved(false);

    if (safetyMarginType === "custom" && (Number.isNaN(safetyMarginCustomNum) || safetyMarginCustomNum < 0)) {
      setError("Informe uma margem de segurança personalizada válida.");
      return;
    }
    if (Number.isNaN(promoDiscountNum) || promoDiscountNum < 0 || promoDiscountNum > 100) {
      setError("Informe um desconto promocional válido (0 a 100%).");
      return;
    }
    if (!practicedPriceValid || practicedPriceNum < 0) {
      setError("Informe um preço praticado válido.");
      return;
    }
    if (minPriceResult.minPrice !== null && practicedPriceBelowMin) {
      setError(`O preço praticado não pode ficar abaixo do preço mínimo sustentável (${formatCurrency(minPriceResult.minPrice)}).`);
      return;
    }
    if (promoResult.belowMin) {
      const maxPct = promoResult.maxDiscountPct !== null ? formatNumber(promoResult.maxDiscountPct, { maximumFractionDigits: 1 }) : "0";
      setError(
        `Esse desconto deixaria o combo abaixo do preço mínimo sustentável (${formatCurrency(minPriceResult.minPrice ?? 0)}). Desconto máximo permitido: ${maxPct}%.`
      );
      return;
    }

    setError(null);
    startSaving(async () => {
      const result = await updateComboPricing(combo.id, {
        safety_margin_type: safetyMarginType,
        safety_margin_custom_pct: safetyMarginType === "custom" ? safetyMarginCustomNum : null,
        promo_discount_pct: promoDiscountNum,
        practiced_price: practicedPriceNum,
      });
      if (!result.success) {
        setError(result.error ?? "Erro ao salvar precificação.");
      } else {
        setSaved(true);
      }
    });
  };

  if (!costSettings) {
    return (
      <div className="flex flex-col gap-3">
        <Card title="Receitas do combo">
          <ComboLinesList lines={lines} summedPrice={summedPrice} />
        </Card>
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          Configure seus custos em Configurações de Custos antes de definir o preço deste combo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {hasIssue && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          Alguma receita deste combo tem % de perda inválida e ficou de fora do cálculo — revise
          essa receita para um preço mais preciso.
        </p>
      )}

      <Card title="Receitas do combo">
        <ComboLinesList lines={lines} summedPrice={summedPrice} />
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card title="Preço mínimo" description="O menor preço que ainda cobre custo, estrutura e a margem de segurança escolhida.">
          <div className="flex gap-2">
            {MARGIN_OPTIONS.map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => setSafetyMarginType(option.type)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  safetyMarginType === option.type
                    ? "border-accent bg-accent text-white"
                    : "border-neutral-300 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {safetyMarginType === "custom" && (
            <input
              value={safetyMarginCustomPct}
              onChange={(e) => setSafetyMarginCustomPct(e.target.value)}
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="% personalizada"
              className={inputClass}
            />
          )}

          <Stat
            label="Preço mínimo"
            value={minPriceResult.minPrice !== null ? formatCurrency(minPriceResult.minPrice) : "—"}
            highlight
          />
        </Card>

        <Card title="Preço recomendado" description="Média entre o preço via soma das receitas e o preço via custo do combo.">
          <Stat label="Preço recomendado" value={formatCurrency(recommendedResult.recommended)} highlight />
          <div className="grid grid-cols-2 gap-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
            <Stat label="Via soma (−12,5%)" value={formatCurrency(recommendedResult.viaSum)} secondary />
            <Stat
              label="Via custo × markup"
              value={recommendedResult.viaCost !== null ? formatCurrency(recommendedResult.viaCost) : "—"}
              secondary
            />
          </div>
          {recommendedResult.divergenceWarning && (
            <p className="text-xs text-amber-600 dark:text-amber-500">
              As receitas deste combo têm margens muito desiguais entre si — considere revisar.
            </p>
          )}
        </Card>
      </div>

      <Card title="Preço promocional e preço praticado">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Desconto promocional (%)</label>
            <input
              value={promoDiscountPct}
              onChange={(e) => setPromoDiscountPct(e.target.value)}
              type="number"
              step="0.1"
              min="0"
              max="100"
              className={`${inputClass} mt-1`}
            />
            <p className="mt-1 text-xs text-neutral-500">
              Preço promocional: <span className="font-mono font-medium">{formatCurrency(promoResult.price)}</span>
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Preço praticado (R$)</label>
            <input
              value={practicedPrice}
              onChange={(e) => setPracticedPrice(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              className={`${inputClass} mt-1 ${practicedPriceBelowMin ? "border-red-400" : ""}`}
            />
            {practicedPriceBelowMin && minPriceResult.minPrice !== null && (
              <p className="mt-1 text-xs text-red-600">
                Abaixo do preço mínimo ({formatCurrency(minPriceResult.minPrice)}).
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-neutral-200 pt-4 sm:grid-cols-4 dark:border-neutral-800">
          <Stat
            label="Economia do cliente"
            value={economia !== null ? formatCurrency(economia) : "—"}
            highlight
          />
          <Stat
            label="Lucro aproximado (R$)"
            value={profitMetrics ? formatCurrency(profitMetrics.profitValue) : "—"}
          />
          <Stat
            label="Lucro aproximado (%)"
            value={
              profitMetrics
                ? `${formatNumber(profitMetrics.profitPct, { maximumFractionDigits: 1 })}%`
                : "—"
            }
          />
          <Stat
            label="Preço somado"
            value={formatCurrency(summedPrice)}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={isSaving}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-active disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : "Salvar precificação"}
          </button>
          {saved && <span className="text-sm text-green-600 dark:text-green-500">Salvo.</span>}
        </div>
      </Card>

      {platforms.length > 0 && (
        <Card title="Preço por plataforma">
          <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                  <th className="px-3 py-2 font-medium">Plataforma</th>
                  <th className="px-3 py-2 font-medium">Taxa</th>
                  <th className="px-3 py-2 font-medium">Mínimo</th>
                  <th className="px-3 py-2 font-medium">Recomendado</th>
                  <th className="px-3 py-2 font-medium">Promocional</th>
                </tr>
              </thead>
              <tbody>
                {platformRows.map(({ platform, min, recommended, promo }) => (
                  <tr key={platform.id} className="border-b border-neutral-200 last:border-b-0 dark:border-neutral-800">
                    <td className="px-3 py-2 font-medium">{platform.name}</td>
                    <td className="px-3 py-2 font-mono text-neutral-500">{formatNumber(platform.fee_pct)}%</td>
                    <td className="px-3 py-2 font-mono">{min !== null ? formatCurrency(min) : "—"}</td>
                    <td className="px-3 py-2 font-mono">{recommended !== null ? formatCurrency(recommended) : "—"}</td>
                    <td className="px-3 py-2 font-mono">{promo !== null ? formatCurrency(promo) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function ComboLinesList({ lines, summedPrice }: { lines: ComboRecipeLine[]; summedPrice: number }) {
  return (
    <div className="flex flex-col gap-2">
      {lines.map((line) => (
        <div
          key={line.id}
          className="flex items-center justify-between gap-3 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
        >
          <span>
            {formatNumber(line.quantity)}x {line.recipeName}
          </span>
          <span className="font-mono text-neutral-500">
            {line.suggestedPrice !== null ? formatCurrency(line.suggestedPrice) : "—"}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-neutral-200 pt-2 text-sm dark:border-neutral-800">
        <span className="text-neutral-500">Preço somado</span>
        <span className="font-mono text-neutral-400 line-through">{formatCurrency(summedPrice)}</span>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
  secondary,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  secondary?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`text-xs uppercase tracking-wide ${secondary ? "text-neutral-400" : "text-neutral-500"}`}>
        {label}
      </span>
      <span
        className={
          highlight
            ? "font-mono text-2xl font-semibold"
            : secondary
              ? "font-mono text-sm text-neutral-500"
              : "font-mono text-lg font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}
