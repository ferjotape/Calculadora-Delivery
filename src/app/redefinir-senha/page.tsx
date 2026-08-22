import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <Logo className="justify-center" markClassName="h-9 w-9" textClassName="text-2xl" />

      <div className="rounded-xl border border-neutral-200 p-6 shadow-sm dark:border-neutral-800">
        <div>
          <h1 className="text-2xl">Redefinir senha</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Escolha uma nova senha para sua conta CUSTTO.
          </p>
        </div>

        <ResetPasswordForm />
      </div>
    </div>
  );
}
