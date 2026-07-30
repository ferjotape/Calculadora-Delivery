"use client";

import { useState, useTransition } from "react";
import {
  createPlatform,
  deletePlatform,
  setPlatformActive,
  updatePlatform,
} from "./actions";
import { PLATFORM_PRESETS } from "@/lib/validation/delivery-platform";
import type { DeliveryPlatform } from "@/lib/types/database";

type Props = {
  initialPlatforms: DeliveryPlatform[];
};

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100";

export function PlatformsManager({ initialPlatforms }: Props) {
  const [platforms, setPlatforms] = useState<DeliveryPlatform[]>(initialPlatforms);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <NewPlatformForm
        onCreated={(platform) => {
          setError(null);
          setPlatforms((prev) => [...prev, platform]);
        }}
        onError={setError}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-2">
        {platforms.length === 0 && (
          <p className="text-sm text-neutral-400">Nenhuma plataforma cadastrada ainda.</p>
        )}

        {platforms.map((platform) => (
          <PlatformRow
            key={platform.id}
            platform={platform}
            onUpdated={(updated) => {
              setError(null);
              setPlatforms((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            }}
            onDeleted={(id) => {
              setError(null);
              setPlatforms((prev) => prev.filter((p) => p.id !== id));
            }}
            onError={setError}
          />
        ))}
      </div>
    </div>
  );
}

function NewPlatformForm({
  onCreated,
  onError,
}: {
  onCreated: (platform: DeliveryPlatform) => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [feePct, setFeePct] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    const fee = Number(feePct);
    if (!name.trim() || Number.isNaN(fee)) {
      onError("Informe o nome e a taxa da plataforma.");
      return;
    }

    startTransition(async () => {
      const result = await createPlatform({ name: name.trim(), fee_pct: fee });
      if (result.success && result.platform) {
        onCreated(result.platform);
        setName("");
        setFeePct("");
      } else {
        onError(result.error ?? "Erro ao adicionar plataforma.");
      }
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">Adicionar plataforma</h2>
        <p className="text-sm text-neutral-500">
          Cadastre as plataformas que você usa e a taxa (%) que cada uma cobra sobre o preço de
          venda.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PLATFORM_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setName(preset)}
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            {preset}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setName("")}
          className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          Personalizada
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome (ex: iFood)"
            className={inputClass}
          />
        </div>
        <div className="sm:w-36">
          <input
            value={feePct}
            onChange={(e) => setFeePct(e.target.value)}
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="Taxa %"
            className={inputClass}
          />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 sm:w-auto dark:bg-white dark:text-neutral-900"
        >
          {isPending ? "Adicionando..." : "Adicionar"}
        </button>
      </div>
    </section>
  );
}

function PlatformRow({
  platform,
  onUpdated,
  onDeleted,
  onError,
}: {
  platform: DeliveryPlatform;
  onUpdated: (platform: DeliveryPlatform) => void;
  onDeleted: (id: string) => void;
  onError: (message: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(platform.name);
  const [feePct, setFeePct] = useState(String(platform.fee_pct));
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"save" | "toggle" | "remove" | null>(null);

  const cancelEdit = () => {
    setName(platform.name);
    setFeePct(String(platform.fee_pct));
    setIsEditing(false);
  };

  const save = () => {
    const fee = Number(feePct);
    if (!name.trim() || Number.isNaN(fee)) {
      onError("Informe o nome e a taxa da plataforma.");
      return;
    }

    setPendingAction("save");
    startTransition(async () => {
      const result = await updatePlatform(platform.id, { name: name.trim(), fee_pct: fee });
      setPendingAction(null);
      if (result.success && result.platform) {
        onUpdated(result.platform);
        setIsEditing(false);
      } else {
        onError(result.error ?? "Erro ao salvar plataforma.");
      }
    });
  };

  const toggleActive = () => {
    setPendingAction("toggle");
    startTransition(async () => {
      const result = await setPlatformActive(platform.id, !platform.is_active);
      setPendingAction(null);
      if (result.success && result.platform) {
        onUpdated(result.platform);
      } else {
        onError(result.error ?? "Erro ao atualizar plataforma.");
      }
    });
  };

  const remove = () => {
    if (!window.confirm(`Remover a plataforma "${platform.name}"?`)) {
      return;
    }
    setPendingAction("remove");
    startTransition(async () => {
      const result = await deletePlatform(platform.id);
      setPendingAction(null);
      if (result.success) {
        onDeleted(platform.id);
      } else {
        onError(result.error ?? "Erro ao remover plataforma.");
      }
    });
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-neutral-300 p-3 sm:flex-row sm:items-start dark:border-neutral-700">
        <div className="flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome"
            className={inputClass}
          />
        </div>
        <div className="sm:w-28">
          <input
            value={feePct}
            onChange={(e) => setFeePct(e.target.value)}
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="Taxa %"
            className={inputClass}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="flex-1 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 sm:flex-none dark:bg-white dark:text-neutral-900"
          >
            {pendingAction === "save" ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            disabled={isPending}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 sm:flex-none dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between ${
        platform.is_active
          ? "border-neutral-300 dark:border-neutral-700"
          : "border-neutral-200 opacity-60 dark:border-neutral-800"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            platform.is_active ? "bg-green-500" : "bg-neutral-400"
          }`}
          aria-hidden
        />
        <div>
          <p className="text-sm font-medium">{platform.name}</p>
          <p className="text-xs text-neutral-500">{platform.fee_pct}% de taxa</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleActive}
          disabled={isPending}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          {pendingAction === "toggle"
            ? "Atualizando..."
            : platform.is_active
              ? "Desativar"
              : "Ativar"}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          disabled={isPending}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={isPending}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          {pendingAction === "remove" ? "Removendo..." : "Remover"}
        </button>
      </div>
    </div>
  );
}
