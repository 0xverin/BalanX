"use client";

import { useRef, useState } from "react";
import { useT, type Lang } from "@/lib/i18n-provider";
import { Button, Segmented, Toggle } from "./ui";
import { DownloadIcon, ShieldIcon, UploadIcon, XIcon } from "./icons";

export function SettingsDrawer({
  open,
  onClose,
  lang,
  onLang,
  dark,
  onToggleTheme,
  filterRiskTokens,
  onFilterRiskTokens,
  onExport,
  onImport,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  onLang: (l: Lang) => void;
  dark: boolean;
  onToggleTheme: () => void;
  filterRiskTokens: boolean;
  onFilterRiskTokens: (v: boolean) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onClear: () => void;
}) {
  const t = useT();
  const [confirmClear, setConfirmClear] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t.settings}>
      <div
        className="absolute inset-0"
        style={{ background: "var(--overlay)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      />
      <aside className="glass-strong absolute right-0 top-0 flex h-full w-full max-w-sm flex-col overflow-y-auto p-6 shadow-2xl float-in">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-wide">{t.settings}</h2>
          <Button variant="ghost" onClick={onClose} className="px-2.5" aria-label="Close">
            <XIcon size={16} />
          </Button>
        </div>

        <div className="space-y-6">
          <section className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-widest text-soft">{t.language}</div>
            <Segmented
              options={[
                { value: "en", label: "English" },
                { value: "zh", label: "中文" },
              ]}
              value={lang}
              onChange={onLang}
            />
          </section>

          <section className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-widest text-soft">{t.theme}</div>
            <Segmented
              options={[
                { value: "dark", label: t.dark },
                { value: "light", label: t.light },
              ]}
              value={dark ? "dark" : "light"}
              onChange={() => onToggleTheme()}
            />
          </section>

          <section className="flex items-center justify-between gap-3 rounded-xl border border-line p-3.5">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldIcon size={15} className="text-primary" />
                {t.riskTokens}
              </div>
              <p className="mt-0.5 text-xs text-soft">{t.riskTokensDesc}</p>
            </div>
            <Toggle checked={filterRiskTokens} onChange={onFilterRiskTokens} />
          </section>

          <section className="space-y-2 border-t border-line pt-5">
            <div className="text-xs font-medium uppercase tracking-widest text-soft">{t.exportData}</div>
            <Button variant="outline" className="w-full" onClick={onExport}>
              <DownloadIcon size={15} /> {t.exportData}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImport(f);
                e.target.value = "";
              }}
            />
            <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
              <UploadIcon size={15} /> {t.importData}
            </Button>
          </section>

          <section className="space-y-2 border-t border-line pt-5">
            <div className="text-xs font-medium uppercase tracking-widest text-soft text-destructive">
              {t.clearData}
            </div>
            {confirmClear ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 space-y-2">
                <p className="text-xs text-destructive">{t.clearConfirm}</p>
                <div className="flex gap-2">
                  <Button variant="danger" className="flex-1" onClick={onClear}>
                    {t.clearData}
                  </Button>
                  <Button variant="ghost" className="flex-1" onClick={() => setConfirmClear(false)}>
                    {t.cancel}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="danger" className="w-full" onClick={() => setConfirmClear(true)}>
                {t.clearData}
              </Button>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
