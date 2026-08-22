"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login, requestPasswordReset } from "@/app/auth/actions";
import { Logo } from "@/components/Logo";

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, { error: null });
  const [showForgot, setShowForgot] = useState(false);
  const [resetState, resetAction, resetPending] = useActionState(requestPasswordReset, {
    error: null,
    success: false,
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <Logo className="justify-center" markClassName="h-9 w-9" textClassName="text-2xl" />

      <div className="rounded-xl border border-neutral-200 p-6 shadow-sm dark:border-neutral-800">
        {!showForgot ? (
          <>
            <div>
              <h1 className="text-2xl">Entrar</h1>
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
                  className={inputClass}
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
                  className={inputClass}
                />
              </div>

              {state.error && <p className="text-sm text-red-600">{state.error}</p>}

              <button
                type="submit"
                disabled={pending}
                className="mt-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-active disabled:opacity-60"
              >
                {pending ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="mt-4 w-full text-center text-sm text-neutral-500 hover:underline"
            >
              Esqueci minha senha
            </button>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-2xl">Esqueci minha senha</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Informe o e-mail cadastrado e enviaremos um link para redefinir sua senha.
              </p>
            </div>

            {resetState.success ? (
              <p className="mt-6 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
                Se esse e-mail estiver cadastrado, você receberá um link para redefinir sua senha em
                instantes.
              </p>
            ) : (
              <form action={resetAction} className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="reset-email" className="text-sm font-medium">
                    E-mail
                  </label>
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className={inputClass}
                  />
                </div>

                {resetState.error && <p className="text-sm text-red-600">{resetState.error}</p>}

                <button
                  type="submit"
                  disabled={resetPending}
                  className="mt-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-active disabled:opacity-60"
                >
                  {resetPending ? "Enviando..." : "Enviar link de redefinição"}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => setShowForgot(false)}
              className="mt-4 w-full text-center text-sm text-neutral-500 hover:underline"
            >
              ← Voltar para o login
            </button>
          </>
        )}
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
