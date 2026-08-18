// Persistence — thin wrapper around localStorage for the portfolio state.
// The interesting logic (serialize/deserialize with versioning) lives in the
// portfolio module and is tested there; this file is the I/O boundary.

import {
  deserializeState,
  serializeState,
  type PortfolioState,
} from "./portfolio";

const KEY = "balanx:state:v2";

export function loadState(): PortfolioState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return deserializeState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveState(s: PortfolioState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(serializeState(s)));
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
