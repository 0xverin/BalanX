"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, XIcon } from "./icons";

// ─── Button ────────────────────────────────────────────────────
export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "outline";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary:
      "bg-primary text-white hover:brightness-110 active:scale-[0.98] shadow-[0_0_24px_rgba(59,130,246,0.3)]",
    ghost:
      "text-muted hover:text-fg hover:bg-cardbg border border-transparent hover:border-line",
    outline:
      "text-fg border border-line-strong hover:bg-cardbg active:scale-[0.98]",
    danger:
      "text-destructive border border-destructive/40 hover:bg-destructive/10 active:scale-[0.98]",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

// ─── Input ─────────────────────────────────────────────────────
export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-line bg-inputbg px-3.5 py-2.5 text-sm text-fg placeholder:text-soft outline-none transition-colors duration-200 focus:border-primary focus:ring-[3px] focus:ring-primary/20 ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
      {children}
      {hint && <span className="block text-xs text-soft">{hint}</span>}
    </label>
  );
}

// ─── Toggle ────────────────────────────────────────────────────
export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 cursor-pointer ${
        checked ? "bg-primary" : "bg-line-strong"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

// ─── Segmented ─────────────────────────────────────────────────
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-inputbg p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200 cursor-pointer ${
            value === o.value
              ? "bg-cardbg-strong text-fg shadow-sm border border-line-strong"
              : "text-muted hover:text-fg"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0"
        style={{ background: "var(--overlay)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      />
      <div
        className={`glass-strong relative float-in w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl p-6 shadow-2xl`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-wide">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-cardbg hover:text-fg cursor-pointer"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Dropdown ─────────────────────────────────────────────────
export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
  badge?: string;
  logo?: React.ReactNode;
}

export function Dropdown<T extends string>({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: DropdownOption<T>[];
  value: T;
  onChange: (v: T) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);
  const enabled = options.filter((o) => !o.disabled);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-inputbg px-3.5 py-2.5 text-sm text-fg transition-colors duration-200 hover:border-line-strong cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected?.logo}
        <span className="flex-1 truncate text-left font-medium">
          {selected?.label ?? placeholder}
        </span>
        <ChevronDownIcon
          size={15}
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="popover absolute left-0 right-0 top-full z-20 mt-1.5 max-h-64 overflow-y-auto rounded-xl py-1 float-in"
        >
          {options.map((o) => {
            const idx = enabled.findIndex((e) => e.value === o.value);
            const active = highlight === idx;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  disabled={o.disabled}
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => {
                    if (o.disabled) return;
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                    o.disabled
                      ? "cursor-not-allowed opacity-40"
                      : active
                        ? "bg-cardbg"
                        : ""
                  } ${o.value === value ? "text-primary" : "text-fg"}`}
                >
                  {o.logo}
                  <span className="flex-1 truncate font-medium">{o.label}</span>
                  {o.badge && <span className="shrink-0 text-[10px] text-soft">{o.badge}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "gold" | "purple" | "green" | "red";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-cardbg text-muted border border-line",
    gold: "bg-primary/15 text-primary border border-primary/30",
    purple: "bg-accent/15 text-accent-soft border border-accent/30",
    green: "bg-success/15 text-success border border-success/30",
    red: "bg-destructive/15 text-destructive border border-destructive/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
