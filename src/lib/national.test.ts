import { describe, expect, it } from "vitest";
import type { Station } from "./apims";
import { findState } from "./areas";
import { nationalSummary } from "./national";

const st = (
  stateId: string,
  ipu: number | null,
  time: string | null = "2026-10-13T08:00",
): Station => ({
  id: `${stateId}-${ipu}`,
  name: "Stesen",
  state: stateId,
  stateId: findState(stateId)!.apimsStateId,
  lat: 3,
  lon: 101,
  ipu,
  pollutant: "PM2.5",
  time,
});

describe("nationalSummary", () => {
  it("negeri tertinggi dan terendah ikut IPU maksimum setiap negeri", () => {
    const s = nationalSummary([
      st("selangor", 80),
      st("selangor", 104),
      st("pahang", 48),
      st("pahang", 40),
      st("johor", 70, "2026-10-13T09:00"),
    ])!;
    expect(s.highest).toMatchObject({ id: "selangor", ipu: 104 });
    expect(s.lowest).toMatchObject({ id: "pahang", ipu: 48 });
    expect(s.time).toBe("2026-10-13T09:00");
  });
  it("stesen tanpa bacaan diabaikan; kurang dua negeri → tiada ringkasan", () => {
    expect(
      nationalSummary([st("selangor", 90), st("pahang", null)]),
    ).toBeNull();
    expect(nationalSummary([])).toBeNull();
  });
});
