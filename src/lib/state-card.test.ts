import { describe, expect, it } from "vitest";
import type { Station } from "./apims";
import { findState } from "./areas";
import {
  buildStateCardPath,
  parseStateCard,
  summarizeState,
} from "./state-card";

const s = (
  name: string,
  stateId: number,
  ipu: number | null,
  time = "2026-10-13T08:00",
): Station => ({
  id: name,
  name,
  state: "",
  stateId,
  lat: 3,
  lon: 101,
  ipu,
  pollutant: null,
  time,
});

describe("summarizeState", () => {
  const selangor = findState("selangor")!;

  it("stesen negeri itu sahaja, menurun, dengan kiraan > 100", () => {
    const sum = summarizeState(
      [
        s("Banting", 10, 96),
        s("Klang", 10, 132, "2026-10-13T09:00"),
        s("Shah Alam", 10, 118),
        s("Tiada", 10, null),
        s("Cheras", 14, 150),
      ],
      selangor,
    );
    expect(sum).toEqual({
      stations: [
        { name: "Klang", ipu: 132 },
        { name: "Shah Alam", ipu: 118 },
        { name: "Banting", ipu: 96 },
      ],
      unhealthy: 2,
      time: "2026-10-13T09:00",
    });
  });

  it("null bila tiada bacaan", () => {
    expect(summarizeState([s("Klang", 10, null)], selangor)).toBeNull();
  });
});

describe("parseStateCard", () => {
  it("menerima negeri sah dan menolak yang lain", () => {
    const path = buildStateCardPath("sabah", "en", "story");
    const params = Object.fromEntries(
      new URL(path, "https://hezy.my").searchParams,
    );
    expect(parseStateCard(params)).toMatchObject({
      state: { id: "sabah" },
      lang: "en",
      format: "story",
    });
    expect(parseStateCard({ g: "x" })).toBeNull();
    expect(parseStateCard({ g: "johor", l: "fr", f: "big" })).toMatchObject({
      lang: "ms",
      format: "square",
    });
  });
});
