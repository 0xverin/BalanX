"use client";

import { useT } from "@/lib/i18n-provider";
import { Button } from "./ui";
import { PlusIcon } from "./icons";

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  const t = useT();
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <div className="glass float-in rounded-3xl p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15">
          <span className="font-display text-2xl font-bold brand-text">B</span>
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
