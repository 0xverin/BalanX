"use client";

import { useRef, useEffect, useState } from "react";
import { I18nProvider, useT, type Lang } from "@/lib/i18n-provider";
import {
  addAccount,
  appendSnapshot,
  createEmptyState,
  deltaVsYesterday,
  deserializeState,
  refreshAll,
  removeAccount,
  serializeState,
  setFilter,
  setRiskFilter,
  totalValue,
  visibleAccounts,
  type PortfolioState,
} from "@/lib/portfolio";
import type { Account, Credential } from "@/lib/types";
import { loadState, saveState, clearState } from "@/lib/storage";
import { fetchAccountBalance } from "@/lib/adapters";
import { msUntilNextUtc8Midnight } from "@/lib/scheduler";
import { Header } from "@/components/header";
import { Overview } from "@/components/overview";
import { AccountCard } from "@/components/account-card";
import { AddAccountModal, type AccountDraft } from "@/components/add-account-modal";
import { SettingsDrawer } from "@/components/settings-drawer";
import { EmptyState } from "@/components/empty-state";
import { Button, Dropdown } from "@/components/ui";
import { PlusIcon } from "@/components/icons";
import { PlatformLogo } from "@/components/platform-logo";
import { supportedPlatforms } from "@/lib/platforms";

function DashboardInner({
  lang,
  onLang,
}: {
  lang: Lang;
  onLang: (l: Lang) => void;
}) {
  const t = useT();
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("balanx-theme") !== "light";
  });
  const [state, setState] = useState<PortfolioState>(() => loadState() ?? createEmptyState());
  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // persist every portfolio change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // keep <html> class in sync with the theme state (class is not React-controlled,
  // so no hydration mismatch; SSR renders dark by default)
  useEffect(() => {
    document.documentElement.classList.toggle("light", !dark);
  }, [dark]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("light", !next);
    localStorage.setItem("balanx-theme", next ? "dark" : "light");
  };

  const total = totalValue(state);
  const delta = deltaVsYesterday(state);
  const visible = visibleAccounts(state);
  const stateRef = useRef(state);

  // keep the scheduler's view of state fresh without re-arming its timer
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const runRefresh = async (from: PortfolioState) => {
    setRefreshing(true);
    try {
      const next = await refreshAll(from, fetchAccountBalance, undefined, {
        includeRiskTokens: !from.filterRiskTokens,
      });
      setState(next);
      return next;
    } finally {
      setRefreshing(false);
    }
  };

  const refresh = () => {
    if (refreshing) return;
    runRefresh(state);
  };

  const manualSnapshot = () => setState((s) => appendSnapshot(s));

  // daily UTC+8 00:00 auto refresh + snapshot — fires only while the page is
  // open (pure-frontend constraint, ADR-0001); re-arms for the next day
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      timer = setTimeout(async () => {
        const from = stateRef.current;
        if (from.accounts.length === 0) return arm();
        const next = await refreshAll(from, fetchAccountBalance, undefined, {
          includeRiskTokens: !from.filterRiskTokens,
        });
        setState(appendSnapshot(next));
        arm();
      }, msUntilNextUtc8Midnight(new Date()));
    };
    arm();
    return () => clearTimeout(timer);
  }, []);

  const remove = (id: string) => setState((s) => removeAccount(s, id));

  const add = (draft: AccountDraft) => {
    const now = new Date().toISOString();
    const account: Account = {
      id: `acc-${Date.now()}`,
      name: draft.name,
      platform: draft.platform,
      createdAt: now,
      lastRefreshed: "",
      chains: draft.chains,
      wallets: draft.wallets,
      ...(draft.credentials ? { credentials: draft.credentials as Credential } : {}),
      totalValue: 0,
    };
    const next = addAccount(state, account);
    setState(next);
    runRefresh(next); // fetch real balances immediately after adding
  };



  const exportData = () => {
    const blob = new Blob([JSON.stringify(serializeState(state), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `balanx-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    file.text().then((txt) => {
      try {
        const restored = deserializeState(JSON.parse(txt));
        if (restored) setState(restored);
        else alert("Invalid backup file");
      } catch {
        alert("Invalid backup file");
      }
    });
  };

  const clearData = () => {
    setState(createEmptyState());
    clearState();
    setSettingsOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        lang={lang}
        onLang={onLang}
        dark={dark}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {state.accounts.length === 0 ? (
          <EmptyState onAdd={() => setAddOpen(true)} />
        ) : (
          <div className="space-y-8">
            <Overview
              total={total}
              delta={delta}
              snapshots={state.snapshots}
              refreshing={refreshing}
              lastRefreshed={state.lastRefreshed}
              onRefresh={refresh}
              onSnapshot={manualSnapshot}
            />

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted">
                  {t.accounts}{" "}
                  <span className="num text-soft">({state.accounts.length})</span>
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-44">
                    <Dropdown
                      options={[
                        { value: "all", label: t.all },
                        ...supportedPlatforms.map((p) => ({
                          value: p.id,
                          label: t[p.nameKey] as string,
                          logo: <PlatformLogo platform={p} size={16} />,
                        })),
                      ]}
                      value={state.filter}
                      onChange={(f) => setState((s) => setFilter(s, f))}
                    />
                  </div>
                  <Button onClick={() => setAddOpen(true)}>
                    <PlusIcon size={15} /> {t.addAccount}
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {visible.map((a) => (
                  <AccountCard
                    key={a.id}
                    account={a}
                    filterRiskTokens={state.filterRiskTokens}
                    onDelete={remove}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-line py-4 text-center text-[11px] text-soft">
        BalanX — {t.demoNotice} · {t.tagline}
      </footer>

      <AddAccountModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={add} />
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        lang={lang}
        onLang={onLang}
        dark={dark}
        onToggleTheme={toggleTheme}
        filterRiskTokens={state.filterRiskTokens}
        onFilterRiskTokens={(v) => setState((s) => setRiskFilter(s, v))}
        onExport={exportData}
        onImport={importData}
        onClear={clearData}
      />
    </div>
  );
}

export default function Dashboard() {
  const [lang, setLang] = useState<Lang>("en");
  // Post-hydration restore of the saved locale is intentional: SSR always
  // renders English so the server HTML stays stable, then we flip to the
  // user's preference. (Suppressing sync-setState-in-effect on purpose.)
  useEffect(() => {
    const l = localStorage.getItem("balanx-lang");
    if (l === "zh" || l === "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLang(l);
    }
  }, []);
  const applyLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("balanx-lang", l);
    document.documentElement.lang = l;
  };
  return (
    <I18nProvider lang={lang}>
      <DashboardInner lang={lang} onLang={applyLang} />
    </I18nProvider>
  );
}
