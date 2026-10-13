import { describe, expect, it } from "vitest";
import { decideAlert } from "./alert";
import { defaultThreshold, parseSubscribeBody } from "./push-validate";

const NOW = new Date("2026-10-12T02:00:00Z");
const unhealthy = {
  ipu: 156,
  category: "tidak-sihat" as const,
  label: "Tidak Sihat",
};
const moderate = {
  ipu: 80,
  category: "sederhana" as const,
  label: "Sederhana",
};

describe("decideAlert", () => {
  it("menghantar amaran pertama bila IPU melebihi 100", () => {
    const d = decideAlert(
      { lastAlertKey: null, lastAlertAt: null },
      unhealthy,
      "Shah Alam",
      NOW,
    );
    expect(d).toMatchObject({
      send: true,
      title: "Jerebu di Shah Alam: IPU 156 (Tidak Sihat)",
    });
    expect(d.send && d.body).toBe("Elak bersenam di luar hari ini.");
    expect(d.next.lastAlertKey).toBe("tidak-sihat");
  });

  it("menghantar notifikasi dalam bahasa Inggeris", () => {
    const d = decideAlert(
      { lastAlertKey: null, lastAlertAt: null },
      unhealthy,
      "Berhampiran Shah Alam",
      NOW,
      100,
      "en",
    );
    expect(d).toMatchObject({
      send: true,
      title: "Haze in Near Shah Alam: API 156 (Unhealthy)",
      body: "Avoid exercising outdoors today.",
    });
    const recovered = decideAlert(d.next, moderate, "Klang", NOW, 100, "en");
    expect(recovered).toMatchObject({
      title: "Air has improved in Klang: API 80",
      body: "Moderate. Outdoor activities as usual. Sensitive groups should be careful.",
    });
  });

  it("tidak mengulang amaran kategori sama dalam 12 jam", () => {
    const state = {
      lastAlertKey: "tidak-sihat" as const,
      lastAlertAt: "2026-10-11T20:00:00Z",
    };
    expect(decideAlert(state, unhealthy, "Shah Alam", NOW).send).toBe(false);
  });

  it("mengulang amaran selepas 12 jam atau bila kategori berubah", () => {
    expect(
      decideAlert(
        { lastAlertKey: "tidak-sihat", lastAlertAt: "2026-10-11T13:00:00Z" },
        unhealthy,
        "X",
        NOW,
      ).send,
    ).toBe(true);
    expect(
      decideAlert(
        { lastAlertKey: "tidak-sihat", lastAlertAt: "2026-10-12T01:00:00Z" },
        {
          ipu: 230,
          category: "sangat-tidak-sihat",
          label: "Sangat Tidak Sihat",
        },
        "X",
        NOW,
      ).send,
    ).toBe(true);
  });

  it("menghantar notifikasi pulih sekali bila IPU turun", () => {
    const d = decideAlert(
      { lastAlertKey: "tidak-sihat", lastAlertAt: "2026-10-12T00:00:00Z" },
      moderate,
      "X",
      NOW,
    );
    expect(d).toMatchObject({
      send: true,
      title: "Udara pulih di X: IPU 80",
    });
    expect(decideAlert(d.next, moderate, "X", NOW).send).toBe(false);
  });
});

describe("parseSubscribeBody", () => {
  const valid = {
    subscription: {
      endpoint: "https://fcm.googleapis.com/fcm/send/abc",
      keys: { p256dh: "BAbc_-12", auth: "xyz-_9" },
    },
    lat: 3.0731,
    lon: 101.5183,
    locationName: "Shah Alam",
  };

  it("menerima langganan sah dan membundarkan koordinat", () => {
    expect(parseSubscribeBody(valid)).toEqual({
      ok: true,
      value: {
        subscription: valid.subscription,
        threshold: 100,
        locations: [
          { id: "semasa", name: "Shah Alam", lat: 3.07, lon: 101.52 },
        ],
        lang: "ms",
        options: {
          morning: false,
          forecast: false,
          spike: false,
          expected: false,
          quiet: null,
        },
      },
    });
  });

  it("membaca pilihan rutin dan menolak jam tidak sah", () => {
    const p = parseSubscribeBody({
      ...valid,
      options: { morning: true, forecast: true, quiet: { start: 23, end: 6 } },
    });
    expect(p.ok && p.value.options).toEqual({
      morning: true,
      forecast: true,
      spike: false,
      expected: false,
      quiet: { start: 23, end: 6 },
    });
    const bad = parseSubscribeBody({
      ...valid,
      options: { morning: "ya", quiet: { start: 25, end: 6 } },
    });
    expect(bad.ok && bad.value.options).toEqual({
      morning: false,
      forecast: false,
      spike: false,
      expected: false,
      quiet: null,
    });
  });

  it("menerima bahasa notifikasi yang sah sahaja", () => {
    const en = parseSubscribeBody({ ...valid, lang: "en" });
    expect(en.ok && en.value.lang).toBe("en");
    const bad = parseSubscribeBody({ ...valid, lang: "fr" });
    expect(bad.ok && bad.value.lang).toBe("ms");
  });

  it("menolak endpoint bukan https, kunci rosak atau lokasi luar Malaysia", () => {
    expect(
      parseSubscribeBody({
        ...valid,
        subscription: { ...valid.subscription, endpoint: "http://x" },
      }).ok,
    ).toBe(false);
    expect(
      parseSubscribeBody({
        ...valid,
        subscription: {
          ...valid.subscription,
          keys: { p256dh: "<>", auth: "a" },
        },
      }).ok,
    ).toBe(false);
    expect(parseSubscribeBody({ ...valid, lat: 13.7, lon: 100.5 }).ok).toBe(
      false,
    );
    expect(parseSubscribeBody(null).ok).toBe(false);
  });
});

describe("ambang amaran", () => {
  it("menggunakan ambang langganan", () => {
    const state = { lastAlertKey: null, lastAlertAt: null };
    expect(decideAlert(state, moderate, "X", NOW, 50)).toMatchObject({
      send: true,
      title: "Jerebu di X: IPU 80 (Sederhana)",
    });
    expect(decideAlert(state, moderate, "X", NOW, 100).send).toBe(false);
    expect(decideAlert(state, unhealthy, "X", NOW, 200).send).toBe(false);
  });

  it("notifikasi pulih bila IPU turun ke bawah ambang sendiri", () => {
    const d = decideAlert(
      { lastAlertKey: "sederhana", lastAlertAt: "2026-10-12T00:00:00Z" },
      { ipu: 45, category: "baik", label: "Baik" },
      "X",
      NOW,
      50,
    );
    expect(d).toMatchObject({
      send: true,
      title: "Udara pulih di X: IPU 45",
    });
  });

  it("lalai 50 untuk profil berisiko dan 100 untuk umum", () => {
    expect(defaultThreshold("asma")).toBe(50);
    expect(defaultThreshold("anak")).toBe(50);
    expect(defaultThreshold("emas")).toBe(50);
    expect(defaultThreshold("umum")).toBe(100);
  });

  it("menerima ambang sah dan menolak yang lain", () => {
    const base = {
      subscription: {
        endpoint: "https://x.example/p",
        keys: { p256dh: "BA", auth: "a" },
      },
      lat: 3.07,
      lon: 101.52,
    };
    expect(parseSubscribeBody({ ...base, threshold: 50 })).toMatchObject({
      ok: true,
      value: { threshold: 50 },
    });
    expect(parseSubscribeBody({ ...base, threshold: 75 })).toMatchObject({
      ok: true,
      value: { threshold: 100 },
    });
  });
});
