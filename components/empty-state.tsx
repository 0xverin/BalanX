"use client";

import { useT } from "@/lib/i18n-provider";
import { Button } from "./ui";
import { CoinsIcon, PlusIcon, WalletIcon } from "./icons";

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  const t = useT();
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-16 text-center">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass rounded-2xl p-6 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent/15 text-accent-soft">
            <CoinsIcon size={18} />
          </div>
          <h3 className="mt-4 font-semibold">{t.howOkx}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">{t.howOkxDesc}</p>
        </div>
        <div className="glass rounded-2xl p-6 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-primary">
            <WalletIcon size={18} />
          </div>
          <h3 className="mt-4 font-semibold">{t.howBinance}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">{t.howBinanceDesc}</p>
        </div>
      </div>
    </div>
  );
}
