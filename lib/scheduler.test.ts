import { describe, expect, it } from "vitest";
import { msUntilNextUtc8Midnight, utc8Date } from "./scheduler";

describe("msUntilNextUtc8Midnight", () => {
  it("computes the delay until the next 00:00 in UTC+8", () => {
    // 2026-08-18T10:00:00Z = 18:00 UTC+8 → 6h until midnight
    const now = new Date("2026-08-18T10:00:00.000Z");
    expect(msUntilNextUtc8Midnight(now)).toBe(6 * 3600_000);
  });

  it("returns ~1ms just before midnight", () => {
    // 15:59:59.999Z = 23:59:59.999 UTC+8 → 1ms
    const now = new Date("2026-08-18T15:59:59.999Z");
    expect(msUntilNextUtc8Midnight(now)).toBe(1);
  });

  it("rolls to the next day right at midnight", () => {
    // exactly 16:00:00Z = 00:00 UTC+8 → next midnight is 24h away
    const now = new Date("2026-08-18T16:00:00.000Z");
    expect(msUntilNextUtc8Midnight(now)).toBe(24 * 3600_000);
  });
});

describe("utc8Date", () => {
  it("returns the calendar date in UTC+8", () => {
    expect(utc8Date(new Date("2026-08-18T00:00:00.000Z"))).toBe("2026-08-18");
  });

  it("rolls to the next UTC+8 day after 16:00Z", () => {
    expect(utc8Date(new Date("2026-08-18T17:00:00.000Z"))).toBe("2026-08-19");
  });
});
