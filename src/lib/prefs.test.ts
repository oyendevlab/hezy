import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREFS,
  MAX_FAVOURITES,
  addFavourite,
  alertLocations,
  toggleAlertFavourite,
  effectiveThreshold,
  parsePrefs,
  removeFavourite,
  type Prefs,
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
        lang: "jp",
      }),
    );
    expect(prefs).toEqual({
      current: null,
      favourites: [loc("a")],
      profile: "umum",
      theme: "dark",
      showSchool: false,
      alertThreshold: null,
      alertFavourites: [],
      lang: "ms",
      morningSummary: false,
      forecastAlert: true,
      quietHours: { start: 23, end: 6 },
    });
    expect(
      parsePrefs(
        JSON.stringify({
          quietHours: null,
          morningSummary: true,
          forecastAlert: false,
        }),
      ),
    ).toMatchObject({
      quietHours: null,
      morningSummary: true,
      forecastAlert: false,
    });
    expect(
      parsePrefs(JSON.stringify({ quietHours: { start: 5, end: 5 } }))
        .quietHours,
    ).toEqual({ start: 23, end: 6 });
    expect(parsePrefs(JSON.stringify({ lang: "en" })).lang).toBe("en");
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

describe("effectiveThreshold", () => {
  it("ikut profil bila pengguna belum memilih", () => {
    expect(effectiveThreshold({ alertThreshold: null, profile: "asma" })).toBe(
      50,
    );
    expect(effectiveThreshold({ alertThreshold: null, profile: "umum" })).toBe(
      100,
    );
  });
  it("mengutamakan pilihan pengguna", () => {
    expect(effectiveThreshold({ alertThreshold: 200, profile: "asma" })).toBe(
      200,
    );
  });
});

describe("amaran kegemaran", () => {
  it("menggabungkan lokasi semasa dan kegemaran yang dipilih tanpa pendua", () => {
    const at = (id: string, lat: number): SavedLocation => ({
      ...loc(id),
      lat,
    });
    let prefs: Prefs = { ...DEFAULT_PREFS, current: at("a", 3.1) };
    prefs = addFavourite(
      addFavourite(addFavourite(prefs, at("a", 3.1)), at("b", 3.2)),
      at("c", 3.3),
    );
    prefs = toggleAlertFavourite(toggleAlertFavourite(prefs, "a"), "c");
    expect(alertLocations(prefs).map((l) => l.id)).toEqual(["a", "c"]);
    expect(toggleAlertFavourite(prefs, "c").alertFavourites).toEqual(["a"]);
  });

  it("membuang tanda amaran bila kegemaran dibuang", () => {
    const prefs = toggleAlertFavourite(
      addFavourite(DEFAULT_PREFS, loc("b")),
      "b",
    );
    expect(removeFavourite(prefs, "b").alertFavourites).toEqual([]);
  });
});
