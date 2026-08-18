"use client";

import { useState } from "react";
import { useT, type Dict } from "@/lib/i18n-provider";
import { PLATFORMS, platformById } from "@/lib/platforms";
import type { BinanceCredential, BinanceType, ChainId, OkxDexCredential, Platform, Wallet } from "@/lib/types";
import { Badge, Button, Dropdown, Field, Input, Modal } from "./ui";
import { PlatformLogo } from "./platform-logo";
import { PlusIcon, XIcon } from "./icons";

const balanceTypeKey: Record<BinanceType, keyof Dict> = {
  spot: "spot",
  funding: "funding",
  margin: "margin",
  earn: "earn",
  futures: "futures",
};

const CHAIN_OPTS: { value: ChainId; label: string; short: string }[] = [
  { value: "eth", label: "eth", short: "ETH" },
  { value: "bsc", label: "bsc", short: "BSC" },
];

export function AddAccountModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (draft: {
    name: string;
    platform: Platform;
    chains: ChainId[];
    wallets: Wallet[];
    credentials: OkxDexCredential | BinanceCredential;
  }) => void;
}) {
  const t = useT();
  const [platform, setPlatform] = useState<Platform>("okx-dex");
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [chains, setChains] = useState<ChainId[]>(["eth"]);
  const [addresses, setAddresses] = useState<string[]>([""]);
  const [error, setError] = useState("");

  const toggleChain = (c: ChainId) =>
    setChains((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const meta = platformById[platform];

  const submit = () => {
    setError("");
    if (!name.trim()) return setError(t.accountName);
    if (meta.kind === "dex") {
      if (!apiKey.trim() || !secretKey.trim() || !passphrase.trim())
        return setError(`${t.apiKey} / ${t.secretKey} / ${t.passphrase}`);
      if (chains.length === 0) return setError(t.chains);
      const wallets: Wallet[] = addresses
        .filter((a) => a.trim())
        .map((a) => ({ address: a.trim(), chain: chains[0] }));
      if (wallets.length === 0) return setError(t.walletAddress);
      onAdd({
        name: name.trim(),
        platform,
        chains,
        wallets,
        credentials: { apiKey: apiKey.trim(), secretKey: secretKey.trim(), passphrase: passphrase.trim() },
      });
    } else {
      if (!apiKey.trim() || !secretKey.trim())
        return setError(`${t.apiKey} / ${t.secretKey}`);
      onAdd({
        name: name.trim(),
        platform,
        chains: [],
        wallets: [],
        credentials: { apiKey: apiKey.trim(), secretKey: secretKey.trim() },
      });
    }
    setName("");
    setApiKey("");
    setSecretKey("");
    setPassphrase("");
    setAddresses([""]);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t.addAccount} wide>
      <div className="space-y-5">
        <Field label={t.platform}>
          <Dropdown
            options={PLATFORMS.map((p) => ({
              value: p.id,
              label: t[p.nameKey] as string,
              disabled: p.status === "coming-soon",
              badge: p.status === "coming-soon" ? t.comingSoon : undefined,
              logo: <PlatformLogo platform={p} size={18} />,
            }))}
            value={platform}
            onChange={(v) => {
              setPlatform(v);
              setError("");
            }}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.accountName}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.accountNamePh}
            />
          </Field>

          {meta.kind === "dex" ? (
            <div className="sm:col-span-2">
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">
                {t.chains}
              </div>
              <div className="flex gap-2">
                {CHAIN_OPTS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => toggleChain(c.value)}
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all cursor-pointer ${
                      chains.includes(c.value)
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-line text-muted hover:text-fg"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                        chains.includes(c.value)
                          ? "border-primary bg-primary text-[#0F172A]"
                          : "border-line-strong"
                      }`}
                    >
                      {chains.includes(c.value) && "✓"}
                    </span>
                    {c.short}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <Field label={t.platform}>
              <Input value={t[meta.nameKey] as string} readOnly disabled className="opacity-60" />
            </Field>
          )}
        </div>

        {meta.kind === "dex" ? (
          <>
            <div className="space-y-3">
              <Field label={t.apiKey}>
                <Input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="xxxx-xxxx-xxxx"
                  className="font-mono text-xs"
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t.secretKey}>
                  <Input
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    type="password"
                    className="font-mono text-xs"
                  />
                </Field>
                <Field label={t.passphrase}>
                  <Input
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    type="password"
                    className="font-mono text-xs"
                  />
                </Field>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted">
                  {t.walletAddress}
                </span>
                <button
                  onClick={() => setAddresses((p) => [...p, ""])}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:brightness-110 cursor-pointer"
                >
                  <PlusIcon size={13} /> {t.addWallet}
                </button>
              </div>
              <div className="space-y-2">
                {addresses.map((a, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={a}
                      onChange={(e) =>
                        setAddresses((p) => p.map((x, j) => (j === i ? e.target.value : x)))
                      }
                      placeholder="0x…"
                      className="font-mono text-xs"
                    />
                    {addresses.length > 1 && (
                      <button
                        onClick={() => setAddresses((p) => p.filter((_, j) => j !== i))}
                        className="rounded-xl border border-line px-2.5 text-muted hover:text-destructive hover:border-destructive/40 cursor-pointer"
                        aria-label="Remove"
                      >
                        <XIcon size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <Field label={t.apiKey}>
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="••••••••••••••••"
                className="font-mono text-xs"
              />
            </Field>
            <Field label={t.secretKey}>
              <Input
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                type="password"
                placeholder="••••••••••••••••"
                className="font-mono text-xs"
              />
            </Field>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(meta.balanceTypes ?? []).map((bt) => (
                <Badge key={bt} tone={bt === "futures" ? "purple" : "gold"}>
                  {t[balanceTypeKey[bt]] as string}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button onClick={submit}>{t.save}</Button>
        </div>
      </div>
    </Modal>
  );
}
