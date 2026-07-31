"use client";

import { useActionState } from "react";
import { createCheckoutSession } from "./actions";

type Props = {
  label: string;
  trialNote: string;
};

export function SubscribeButton({ label, trialNote }: Props) {
  const [state, formAction, pending] = useActionState(createCheckoutSession, {});

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent-active disabled:opacity-60"
      >
        {pending ? "Redirecionando..." : label}
      </button>
      {state.error && <p className="text-center text-sm text-red-600">{state.error}</p>}
      <p className="text-center text-xs text-neutral-400">{trialNote}</p>
    </form>
  );
}
