"use client";

import { useT, type Lang } from "@/lib/i18n-provider";
import { GlobeIcon, MoonIcon, SettingsIcon, SunIcon } from "./icons";
import { Button } from "./ui";

export function Header({
  lang,
  onLang,
  dark,
  onToggleTheme,
  onOpenSettings,
}: {
  lang: Lang;
  onLang: (l: Lang) => void;
  dark: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}) {
  const t = useT();
  return (
    <header className="sticky top-0 z-40 border-b border-line glass">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 border border-primary/30">
            <span className="font-display text-sm font-bold brand-text">B</span>
          </div>
          <div className="leading-tight">
            <div className="font-display text-base font-bold tracking-widest">
              BALAN<span className="brand-text">X</span>
            </div>
            <div className="hidden text-[11px] text-soft sm:block">{t.tagline}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-xl border border-line bg-inputbg p-1">
            <button
              onClick={() => onLang("en")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                lang === "en" ? "bg-cardbg-strong text-fg border border-line-strong" : "text-muted hover:text-fg"
              }`}
            >
              <GlobeIcon size={13} /> English
            </button>
            <button
              onClick={() => onLang("zh")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                lang === "zh" ? "bg-cardbg-strong text-fg border border-line-strong" : "text-muted hover:text-fg"
              }`}
            >
              <GlobeIcon size={13} /> 中文
            </button>
          </div>

          <Button variant="ghost" onClick={onToggleTheme} aria-label="Toggle theme" className="px-2.5">
            {dark ? <SunIcon size={17} /> : <MoonIcon size={17} />}
          </Button>
          <Button variant="ghost" onClick={onOpenSettings} aria-label="Settings" className="px-2.5">
            <SettingsIcon size={17} />
          </Button>
        </div>
      </div>
    </header>
  );
}
