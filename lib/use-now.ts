"use client";

import { useEffect, useState } from "react";

/**
 * Ticking clock. Re-renders the component every `intervalMs` so
 * relative timestamps ("2 min ago") stay fresh without calling
 * Date.now() during render (React 19 purity rule).
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
