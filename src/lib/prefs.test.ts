import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREFS,
  MAX_FAVOURITES,
  addFavourite,
  parsePrefs,
  removeFavourite,
  type SavedLocation,
} from "./prefs";

const loc = (id: string): SavedLocation => ({
  id,
  name: id,
  lat: 3,
  lon: 101,
  source: "area",
});

describe("parsePrefs", () => {
  it("memulangkan lalai bila tiada data atau JSON rosak", () => {
    expect(parsePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(parsePrefs("{rosak")).toEqual(DEFAULT_PREFS);
  });

  it("membuang medan yang tidak sah", () => {
    const prefs = parsePrefs(
      JSON.stringify({
        current: { id: "x" },
        favourites: [loc("a"), { name: "tiada id" }],
        profile: "lain",
        theme: "dark",
      }),
    );
    expect(prefs).toEqual({
      current: null,
      favourites: [loc("a")],
      profile: "umum",
      theme: "dark",
      showSchool: false,
    });
  });
});

describe("kegemaran", () => {
  it("tidak menambah pendua atau melebihi had", () => {
    let prefs = DEFAULT_PREFS;
    for (let i = 0; i < MAX_FAVOURITES + 2; i++)
      prefs = addFavourite(prefs, loc(`l${i}`));
    prefs = addFavourite(prefs, loc("l0"));
    expect(prefs.favourites.map((f) => f.id)).toEqual([
      "l0",
      "l1",
      "l2",
      "l3",
      "l4",
    ]);
  });

  it("membuang kegemaran mengikut id", () => {
    const prefs = removeFavourite(addFavourite(DEFAULT_PREFS, loc("a")), "a");
    expect(prefs.favourites).toEqual([]);
  });
});
