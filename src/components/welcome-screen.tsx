"use client";

import { Crosshair } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { findArea } from "@/lib/areas";
import { formatClock } from "@/lib/format";
import { GEO_ERROR_MESSAGE, requestPosition } from "@/lib/geolocation";
import { LANGUAGES } from "@/lib/i18n";
import { ipuCategory } from "@/lib/ipu";
import { areaToLocation, gpsToLocation } from "@/lib/locations";
import type { NationalSummary } from "@/lib/national";
import { updatePrefs } from "@/lib/prefs";
import { useI18n } from "@/lib/use-i18n";
import { IpuPill } from "./ipu-pill";
import { LocationSearch } from "./location-search";
import { Logo } from "./logo";

/** Bandar popular untuk pilihan satu ketikan. */
const POPULAR = [
  "kuala-lumpur",
  "shah-alam",
  "johor-bahru",
  "george-town",
  "kuching",
  "kota-kinabalu",
] as const;

/**
 * Langit statik (siang) — HTML dijana di pelayan tanpa mengetahui waktu pengguna, jadi
 * langit WebGL hidup tidak digunakan di sini supaya tiada kelipan dan teks sentiasa jelas.
 */
const SKY =
  "radial-gradient(160px 50px at 20% 26%, rgb(255 255 255 / 0.7), transparent 70%)," +
  "radial-gradient(220px 60px at 74% 18%, rgb(255 255 255 / 0.7), transparent 70%)," +
  "radial-gradient(260px 70px at 46% 62%, rgb(255 255 255 / 0.45), transparent 70%)," +
  "linear-gradient(to bottom, #8fb3d9, #b9cfe6 55%, #dfe7ee)";

/**
 * Skrin alu-aluan pengguna baharu (nilai dahulu): pilih lokasi dengan GPS, cip bandar
 * popular atau carian — satu ketikan terus ke Utama. Juga dirender sebagai HTML statik
 * (lihat `data-welcome` dalam storage-keys) supaya muncul sebelum JavaScript dimuatkan.
 */
export function WelcomeScreen({
  national,
  active,
}: {
  national: NationalSummary | null;
  /** Prefs sudah dibaca dan tiada lokasi: sembunyikan navigasi (dalam `<head>` untuk muatan pertama). */
  active: boolean;
}) {
  const { t, lang } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    root.setAttribute("data-welcome", "");
    return () => root.removeAttribute("data-welcome");
  }, [active]);

  async function useGps() {
    setBusy(true);
    setError(null);
    const result = await requestPosition();
    setBusy(false);
    if (!result.ok) {
      setError(t(GEO_ERROR_MESSAGE[result.reason]));
      return;
    }
    updatePrefs((p) => ({
      ...p,
      current: gpsToLocation(result.lat, result.lon),
    }));
  }

  const pick = (id: string) => {
    const area = findArea(id);
    if (area) updatePrefs((p) => ({ ...p, current: areaToLocation(area) }));
  };

  return (
    <div
      data-welcome-screen
      className="mx-auto flex min-h-[calc(100svh-24px)] w-full max-w-[1200px] flex-col md:grid md:min-h-[calc(100svh-48px)] md:grid-cols-[1.1fr_1fr] md:gap-0 md:px-10 md:py-8"
    >
      <section
        className="relative flex flex-col gap-3 overflow-hidden px-5 pt-[max(env(safe-area-inset-top),28px)] pb-12 text-[#1c1a16] md:rounded-l-[32px] md:px-12 md:py-12"
        style={{ background: SKY }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Logo size={44} />
            <span className="font-display hidden text-2xl font-extrabold md:inline">
              Hezy
            </span>
          </div>
          {/* Bahasa boleh dipilih sebelum lokasi (Tetapan belum boleh dicapai). */}
          <div
            role="group"
            aria-label={t("Bahasa")}
            className="flex rounded-full bg-white/70 p-1 shadow-[0_1px_6px_rgb(0_0_0/0.1)]"
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.key}
                type="button"
                lang={l.key}
                aria-pressed={lang === l.key}
                onClick={() => updatePrefs((p) => ({ ...p, lang: l.key }))}
                className={`min-h-9 min-w-11 rounded-full px-3 text-[13px] font-bold ${
                  lang === l.key ? "bg-[#1c1a16] text-white" : "text-[#1c1a16]"
                }`}
              >
                <span aria-hidden="true">{l.key === "ms" ? "BM" : "EN"}</span>
                <span className="sr-only">{l.label}</span>
              </button>
            ))}
          </div>
        </div>
        <h1 className="font-display mt-3 max-w-[12ch] text-[34px] leading-[1.02] font-extrabold tracking-[-0.015em] text-balance md:mt-10 md:text-[52px]">
          {t("Semak jerebu di kawasan anda")}
        </h1>
        <p className="max-w-[34ch] text-[15px] leading-relaxed text-[#2d3440] md:text-[17px]">
          {t("IPU rasmi APIMS dan nasihat kesihatan, dikemas kini setiap jam.")}
        </p>
        {national && (
          <div
            data-testid="national-summary"
            className="mt-3 flex max-w-[440px] flex-col gap-2 rounded-2xl bg-white/85 px-4 py-3 shadow-[0_1px_6px_rgb(0_0_0/0.08)] md:mt-auto"
          >
            <div className="flex justify-between text-[11px] font-bold tracking-[0.08em] text-[#5a564e]">
              <span>{t("MALAYSIA SEKARANG")}</span>
              {national.time && (
                <span className="text-[#1f7a45]">
                  ● {formatClock(national.time, lang)}
                </span>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-3">
              {(
                [
                  ["Tertinggi", national.highest],
                  ["Terendah", national.lowest],
                ] as const
              ).map(([label, s]) => (
                <div key={label} className="flex min-w-0 flex-col gap-1">
                  <dt className="text-xs text-[#5a564e]">{t(label)}</dt>
                  <dd className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate text-[15px] font-bold">
                      {s.name}
                    </span>
                    <span className="font-display text-xl font-bold tabular-nums">
                      {s.ipu}
                    </span>
                    <IpuPill
                      category={ipuCategory(s.ipu).key}
                      label={t(ipuCategory(s.ipu).label)}
                      className="!px-2 !py-0.5 !text-[11px]"
                    />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>

      <section className="bg-page relative -mt-6 flex flex-1 flex-col gap-3 rounded-t-[28px] px-5 pt-6 pb-8 md:mt-0 md:justify-center md:rounded-t-none md:rounded-r-[32px] md:border md:border-l-0 md:border-[var(--line)] md:px-12">
        <h2 className="font-display hidden text-2xl font-bold md:block">
          {t("Di mana anda berada?")}
        </h2>
        <button
          type="button"
          onClick={useGps}
          disabled={busy}
          className="bg-ink text-page flex min-h-13 items-center justify-center gap-2 rounded-2xl px-5 font-semibold disabled:opacity-60"
        >
          <Crosshair aria-hidden="true" size={20} weight="bold" />
          {busy ? t("Mengesan lokasi…") : t("Guna lokasi saya")}
        </button>
        <p className="text-muted -mt-1 text-center text-xs md:text-left">
          {t("Lokasi dibundarkan ~1 km dan tidak disimpan.")}
        </p>
        {error && (
          <p role="alert" className="text-sm font-semibold">
            {error}
          </p>
        )}
        <h3 className="text-muted mt-2 text-xs font-bold tracking-[0.08em]">
          {t("ATAU PILIH BANDAR")}
        </h3>
        <ul className="flex flex-wrap gap-2">
          {POPULAR.map((id) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => pick(id)}
                className="bg-surface hover:bg-line min-h-11 rounded-full px-4 text-sm font-semibold transition-colors"
              >
                {findArea(id)?.name}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-1">
          <LocationSearch
            onPick={(area) =>
              updatePrefs((p) => ({ ...p, current: areaToLocation(area) }))
            }
          />
        </div>
      </section>
    </div>
  );
}
