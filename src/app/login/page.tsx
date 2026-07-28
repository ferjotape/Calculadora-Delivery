"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/auth/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, { error: null });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <p className="font-heading text-center text-xs font-bold uppercase tracking-wide text-accent">
        Precifica Delivery
      </p>

      <div className="rounded-xl border border-neutral-200 p-6 shadow-sm dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-semibold">Entrar</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Acesse sua conta para gerenciar a precificação do seu delivery.
          </p>
        </div>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
            />
          </div>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-neutral-500">
        Ainda não tem conta?{" "}
        <Link href="/signup" className="font-medium text-neutral-900 underline dark:text-white">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
