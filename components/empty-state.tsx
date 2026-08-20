"use client";

import { useT } from "@/lib/i18n-provider";
import { Button } from "./ui";
import { PlusIcon } from "./icons";
import { BalanxLogo } from "./logo";

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  const t = useT();
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <div className="glass float-in rounded-3xl p-10">
        <div className="flex justify-center">
          <BalanxLogo size={64} />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold tracking-wide">{t.emptyTitle}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">{t.emptyDesc}</p>
        <Button onClick={onAdd} className="mt-8 px-6">
          <PlusIcon size={16} /> {t.addFirstAccount}
        </Button>
      </div>
    </div>
  );
}
