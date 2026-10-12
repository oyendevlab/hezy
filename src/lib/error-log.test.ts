import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  browserFamily,
  fingerprintSource,
  isNoise,
  mergeError,
  parseReport,
  stripQueries,
} from "./error-log";
import { APP_VERSION } from "./version";

const ORIGIN = "https://hezy.my";

describe("APP_VERSION", () => {
  it("sama seperti package.json", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(APP_VERSION).toBe(pkg.version);
  });
});

describe("parseReport", () => {
  it("membuang query string, memotong teks dan menolak laporan kosong", () => {
    const r = parseReport({
      kind: "rejection",
      message: "x is undefined at https://hezy.my/?lat=3.07&lon=101.5",
      stack: `at f (${ORIGIN}/_next/static/chunks/a.js?v=1:10:5)`,
      path: "/trend?lat=3.07#x",
      version: "0.4.0<script>",
      browser: "Chrome 126 · Android",
    })!;
    expect(r.message).toBe("x is undefined at https://hezy.my/");
    expect(r.stack).toBe(`at f (${ORIGIN}/_next/static/chunks/a.js:10:5)`);
    expect(r.path).toBe("/trend");
    expect(r.version).toBe("0.4.0script");
    expect(r.kind).toBe("rejection");
    expect(parseReport({ message: "  " })).toBeNull();
    expect(parseReport(null)).toBeNull();
    expect(
      parseReport({ message: "a".repeat(999), kind: "lain" }),
    ).toMatchObject({
      kind: "error",
      path: "/",
    });
    expect(parseReport({ message: "a".repeat(999) })!.message).toHaveLength(
      300,
    );
  });

  it("stripQueries mengekalkan teks lain", () => {
    expect(stripQueries("lihat https://a.b/c?d=1 dan (https://x.y/z#h)")).toBe(
      "lihat https://a.b/c dan (https://x.y/z)",
    );
  });
});

describe("isNoise", () => {
  it("menapis sambungan pelayar, skrip luar dan hingar biasa", () => {
    expect(isNoise("ResizeObserver loop limit exceeded", "", ORIGIN)).toBe(
      true,
    );
    expect(
      isNoise("boom", "at x (chrome-extension://abc/x.js:1:1)", ORIGIN),
    ).toBe(true);
    expect(
      isNoise("boom", "at x (https://cdn.lain.com/x.js:1:1)", ORIGIN),
    ).toBe(true);
    expect(
      isNoise("boom", `at x (${ORIGIN}/_next/static/a.js:1:1)`, ORIGIN),
    ).toBe(false);
    expect(isNoise("render gagal", "", ORIGIN)).toBe(false);
  });
});

describe("browserFamily", () => {
  it("jenis pelayar dan sistem tanpa butiran peranti", () => {
    expect(
      browserFamily(
        "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
      ),
    ).toBe("Chrome 126 · Android");
    expect(
      browserFamily(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe("Safari 18 · iOS");
  });
});

describe("fingerprintSource dan mergeError", () => {
  it("ralat sama di lajur berbeza berkongsi cap jari; kiraan bertambah", () => {
    const a = parseReport({
      message: "boom",
      stack: `at f (${ORIGIN}/_next/a.js:10:5)`,
    })!;
    const b = parseReport({
      message: "boom",
      stack: `at f (${ORIGIN}/_next/a.js:10:9)`,
    })!;
    expect(fingerprintSource(a)).toBe(fingerprintSource(b));
    const now = new Date("2026-10-12T06:00:00Z");
    const first = mergeError(null, a, now);
    const second = mergeError(first, b, new Date("2026-10-12T07:00:00Z"));
    expect(second).toMatchObject({
      count: 2,
      firstSeen: "2026-10-12T06:00:00.000Z",
      lastSeen: "2026-10-12T07:00:00.000Z",
    });
  });
});
