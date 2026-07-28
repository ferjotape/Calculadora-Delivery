import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { PlatformsManager } from "./PlatformsManager";

export default async function PlatformsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: platforms } = await supabase
    .from("delivery_platforms")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-12">
      <AppHeader active="platforms" />

      <div>
        <h1 className="text-2xl font-semibold">Plataformas de delivery</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Cadastre as plataformas que você usa (iFood, 99Food, Keeta, própria...) e a taxa
          cobrada por cada uma.
        </p>
      </div>

      <PlatformsManager initialPlatforms={platforms ?? []} />

      <div className="flex justify-end border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <Link
          href="/onboarding/ingredients"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Continuar
        </Link>
      </div>
    </div>
  );
}
