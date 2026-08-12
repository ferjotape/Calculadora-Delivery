"use client";

import { useActionState } from "react";
import { changePlan } from "./actions";
import type { PlanId } from "@/lib/stripe/plan";

type Props = {
  planId: PlanId;
  label: string;
  variant?: "primary" | "secondary";
};

export function PlanActionButton({ planId, label, variant = "primary" }: Props) {
  const boundChangePlan = changePlan.bind(null, planId);
  const [state, formAction, pending] = useActionState(boundChangePlan, {});

  const className =
    variant === "primary"
      ? "w-full rounded-md bg-accent px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-accent-active disabled:opacity-60"
      : "w-full rounded-md border border-neutral-300 px-4 py-2.5 text-center text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900";

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <button type="submit" disabled={pending} className={className}>
        {pending ? "Processando..." : label}
      </button>
      {state.error && <p className="text-center text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
