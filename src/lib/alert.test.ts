import { describe, expect, it } from "vitest";
import { decideAlert } from "./alert";
import { parseSubscribeBody } from "./push-validate";

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
      title: "Jerebu: IPU 156 (Tidak Sihat)",
    });
    expect(d.send && d.body).toMatch(/^Shah Alam: /);
    expect(d.next.lastAlertKey).toBe("tidak-sihat");
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
      title: "Udara kembali pulih: IPU 80",
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
      value: { ...valid, lat: 3.07, lon: 101.52 },
    });
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
