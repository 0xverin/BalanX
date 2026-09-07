import { describe, expect, it } from "vitest";
import { chainShortLabel, formatRelative, formatUtc8DateTime, formatSnapshotTime } from "./format";
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

describe("formatUtc8DateTime", () => {
  it("renders the UTC+8 wall-clock moment to the minute", () => {
    // 2026-08-18T16:00:00Z = 2026-08-19 00:00 in UTC+8
    expect(formatUtc8DateTime("2026-08-18T16:00:00.000Z")).toBe("2026-08-19 00:00");
    // 2026-08-18T02:35:00Z = 10:35 on 2026-08-18 in UTC+8
    expect(formatUtc8DateTime("2026-08-18T02:35:00.000Z")).toBe("2026-08-18 10:35");
  });
});

describe("formatSnapshotTime", () => {
  it("uses the recorded moment when present (minute precision)", () => {
    expect(formatSnapshotTime("2026-08-18", "2026-08-18T02:35:00.000Z")).toBe(
      "2026-08-18 10:35"
    );
  });

  it("falls back to the date's UTC+8 midnight for pre-`at` snapshots", () => {
    expect(formatSnapshotTime("2026-08-18")).toBe("2026-08-18 00:00");
  });
});
