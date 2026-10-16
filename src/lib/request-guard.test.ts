import { describe, expect, it } from "vitest";
import {
  createWindowLimiter,
  isCronAuthorized,
  isCrossSite,
  readJsonBody,
} from "./request-guard";

const req = (headers: Record<string, string>, body?: string) =>
  new Request("https://hezy.my/api/log", {
    method: "POST",
    headers,
    body,
  });

describe("isCronAuthorized", () => {
  it("menerima Bearer yang betul sahaja", () => {
    expect(isCronAuthorized("Bearer rahsia", "rahsia")).toBe(true);
    expect(isCronAuthorized("Bearer salah", "rahsia")).toBe(false);
    expect(isCronAuthorized("rahsia", "rahsia")).toBe(false);
    expect(isCronAuthorized(null, "rahsia")).toBe(false);
    expect(isCronAuthorized("Bearer ", "")).toBe(false);
  });
});

describe("isCrossSite", () => {
  it("membenarkan asal yang sama dan klien tanpa Origin", () => {
    expect(isCrossSite(req({ origin: "https://hezy.my" }))).toBe(false);
    expect(isCrossSite(req({ "sec-fetch-site": "same-origin" }))).toBe(false);
    expect(isCrossSite(req({}))).toBe(false);
  });

  it("menolak permintaan dari laman lain", () => {
    expect(isCrossSite(req({ origin: "https://jahat.example" }))).toBe(true);
    expect(isCrossSite(req({ "sec-fetch-site": "cross-site" }))).toBe(true);
    expect(isCrossSite(req({ origin: "null" }))).toBe(true);
  });
});

describe("readJsonBody", () => {
  it("menghadkan saiz dan menolak JSON rosak", async () => {
    expect(await readJsonBody(req({}, '{"a":1}'), 100)).toEqual({
      ok: true,
      value: { a: 1 },
    });
    expect(await readJsonBody(req({}, "x".repeat(101)), 100)).toEqual({
      ok: false,
      status: 413,
    });
    expect(await readJsonBody(req({}, "{rosak"), 100)).toEqual({
      ok: false,
      status: 400,
    });
  });
});

describe("createWindowLimiter", () => {
  it("menghadkan bilangan dalam satu tetingkap dan bermula semula selepasnya", () => {
    const allow = createWindowLimiter(2, 1000);
    expect([allow(0), allow(10), allow(20)]).toEqual([true, true, false]);
    expect(allow(1500)).toBe(true);
  });
});
