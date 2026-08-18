import { describe, expect, it } from "vitest";
import { chainShortLabel, formatRelative } from "./format";
import { dictionaries } from "./i18n";

const t = dictionaries.en;

describe("formatRelative", () => {
  it("returns 'just now' within a minute", () => {
    const now = new Date("2026-08-18T12:00:00.000Z").getTime();
    expect(formatRelative("2026-08-18T12:00:20.000Z", now, "en", t)).toBe("just now");
  });

  it("returns minutes ago", () => {
    const now = new Date("2026-08-18T12:05:00.000Z").getTime();
    expect(formatRelative("2026-08-18T12:03:00.000Z", now, "en", t)).toBe("2 min ago");
  });

  it("falls back to local time after an hour", () => {
    const now = new Date("2026-08-18T14:00:00.000Z").getTime();
    const out = formatRelative("2026-08-18T11:00:00.000Z", now, "en", t);
    expect(out).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe("chainShortLabel", () => {
  it("maps chain ids to display labels", () => {
    expect(chainShortLabel("eth")).toBe("ETH");
    expect(chainShortLabel("bsc")).toBe("BSC");
  });
});
