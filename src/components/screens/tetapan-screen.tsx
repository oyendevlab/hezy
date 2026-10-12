"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { HEALTH_PROFILES } from "@/lib/advice";
import { LANGUAGES } from "@/lib/i18n";
import { promptInstall, useInstallStatus } from "@/lib/install";
import {
  DEFAULT_PREFS,
  updatePrefs,
  usePrefs,
  alertLocations,
  effectiveThreshold,
  type Prefs,
  type SavedLocation,
  type ThemePref,
} from "@/lib/prefs";
import {
  currentSubscription,
  disablePush,
  enablePush,
  pushSupport,
} from "@/lib/push-client";
import { useI18n } from "@/lib/use-i18n";
import { Skeleton } from "../status";

const THEMES: { key: ThemePref; label: string }[] = [
  { key: "system", label: "Ikut peranti" },
  { key: "light", label: "Cerah" },
  { key: "dark", label: "Gelap" },
];

export function TetapanScreen() {
  const prefs = usePrefs();
  const { t } = useI18n();

  function clearData() {
    if (
      !window.confirm(
        t("Padam lokasi, kegemaran dan tetapan yang disimpan di peranti ini?"),
      )
    )
      return;
    try {
      Object.keys(window.localStorage)
        .filter((key) => key.startsWith("hezy:"))
        .forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // Storan tidak tersedia.
    }
    updatePrefs(() => DEFAULT_PREFS);
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6 px-5 pt-13 md:px-10 md:pt-10">
      <h1 className="font-display text-[30px] font-bold">{t("Tetapan")}</h1>

      {prefs === null ? (
        <Skeleton className="h-96" />
      ) : (
        <>
          <fieldset>
            <legend className="text-muted mb-2 text-sm font-bold tracking-wide">
              {t("PROFIL KESIHATAN")}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {HEALTH_PROFILES.map((p) => (
                <label
                  key={p.key}
                  className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-2xl border-2 px-3.5 text-sm font-semibold ${
                    prefs.profile === p.key
                      ? "border-ink bg-ipu-tidak-sihat-tint text-[#1c1a16]"
                      : "bg-surface border-transparent"
                  }`}
                >
                  <input
                    type="radio"
                    name="profile"
                    value={p.key}
                    checked={prefs.profile === p.key}
                    onChange={() =>
                      updatePrefs((x) => ({ ...x, profile: p.key }))
                    }
                    className="size-4 accent-[#1c1a16]"
                  />
                  {t(p.label)}
                </label>
              ))}
            </div>
            <p className="text-muted mt-2 text-xs">
              {t("Nasihat di skrin Utama disesuaikan mengikut profil ini.")}
            </p>
            <label className="bg-surface mt-3 flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold">
              <input
                type="checkbox"
                checked={prefs.profile === "anak" || prefs.showSchool}
                disabled={prefs.profile === "anak"}
                onChange={(e) =>
                  updatePrefs((x) => ({ ...x, showSchool: e.target.checked }))
                }
                className="size-4 accent-[#1c1a16]"
              />
              <span>
                {t("Papar status sekolah (panduan KPM)")}
                <span className="text-muted block text-xs font-medium">
                  {t("Sentiasa dipaparkan untuk profil Kanak-kanak")}
                </span>
              </span>
            </label>
          </fieldset>

          <fieldset>
            <legend className="text-muted mb-2 text-sm font-bold tracking-wide">
              {t("TEMA")}
            </legend>
            <div className="bg-surface grid grid-cols-3 gap-1 rounded-2xl p-1">
              {THEMES.map((theme) => (
                <label
                  key={theme.key}
                  className={`has-focus-visible:outline-ink flex min-h-11 cursor-pointer items-center justify-center rounded-xl text-sm has-focus-visible:outline-2 ${
                    prefs.theme === theme.key
                      ? "bg-page font-bold"
                      : "text-muted font-medium"
                  }`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={theme.key}
                    checked={prefs.theme === theme.key}
                    onChange={() =>
                      updatePrefs((x) => ({ ...x, theme: theme.key }))
                    }
                    className="sr-only"
                  />
                  {t(theme.label)}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-muted mb-2 text-sm font-bold tracking-wide">
              {t("BAHASA")}
            </legend>
            <div className="bg-surface grid grid-cols-2 gap-1 rounded-2xl p-1">
              {LANGUAGES.map((l) => (
                <label
                  key={l.key}
                  lang={l.key}
                  className={`has-focus-visible:outline-ink flex min-h-11 cursor-pointer items-center justify-center rounded-xl text-sm has-focus-visible:outline-2 ${
                    prefs.lang === l.key
                      ? "bg-page font-bold"
                      : "text-muted font-medium"
                  }`}
                >
                  <input
                    type="radio"
                    name="lang"
                    value={l.key}
                    checked={prefs.lang === l.key}
                    onChange={() => updatePrefs((x) => ({ ...x, lang: l.key }))}
                    className="sr-only"
                  />
                  {l.label}
                </label>
              ))}
            </div>
          </fieldset>

          <section>
            <h2 className="text-muted mb-2 text-sm font-bold tracking-wide">
              {t("AMARAN")}
            </h2>
            <AlertRow prefs={prefs} />
          </section>

          <section>
            <h2 className="text-muted mb-2 text-sm font-bold tracking-wide">
              {t("APLIKASI")}
            </h2>
            <div className="divide-line bg-surface divide-y rounded-2xl px-4 text-sm">
              <InstallRow />
              <Row
                label={t("Luar talian")}
                value={t("Bacaan terakhir disimpan di peranti")}
              />
            </div>
          </section>

          <section>
            <h2 className="text-muted mb-2 text-sm font-bold tracking-wide">
              {t("TENTANG DATA")}
            </h2>
            <div className="divide-line bg-surface divide-y rounded-2xl px-4 text-sm">
              <Row
                label={t("Bacaan rasmi")}
                value={t("APIMS (JAS), stesen ≤ 30 km")}
              />
              <Row label={t("Anggaran & ramalan")} value="Open-Meteo (CAMS)" />
              <Row
                label={t("Kaedah anggaran")}
                value={t("Formula JAS, PM2.5 sahaja")}
              />
              <Row label={t("Versi")} value="0.2.0" />
            </div>
            <p className="text-muted mt-2 text-xs leading-relaxed">
              {t(
                "Bila ada stesen APIMS dalam 30 km dengan bacaan 3 jam terakhir, Hezy memaparkan IPU rasmi stesen itu. Jika tidak, Hezy memaparkan anggaran daripada PM2.5 model, yang mungkin berbeza daripada bacaan rasmi. Graf dan masa terbaik sentiasa menggunakan model.",
              )}
            </p>
          </section>

          <button
            type="button"
            onClick={clearData}
            className="border-line min-h-12 self-start rounded-2xl border-[1.5px] px-4 text-sm font-semibold"
          >
            {t("Padam data di peranti ini")}
          </button>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3">
      <span className="font-semibold">{label}</span>
      <span className="text-muted text-right">{value}</span>
    </div>
  );
}

const INSTALL_HELP = {
  installed: "Hezy sudah dipasang di peranti ini.",
  ios: "Di iPhone atau iPad: ketik butang Kongsi dalam Safari, kemudian pilih “Tambah ke Skrin Utama”.",
  manual:
    "Buka menu pelayar dan pilih “Pasang aplikasi” atau “Tambah ke skrin utama”.",
} as const;

function InstallRow() {
  const { t } = useI18n();
  const status = useInstallStatus();
  if (status === null) return <div className="min-h-12" />;
  return (
    <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 py-3">
      <span className="font-semibold">{t("Pasang Hezy")}</span>
      {status === "available" ? (
        <button
          type="button"
          onClick={() => void promptInstall()}
          className="bg-ink text-page min-h-11 rounded-xl px-4 text-sm font-semibold"
        >
          {t("Pasang")}
        </button>
      ) : (
        <span className="text-muted max-w-[60%] text-right">
          {t(INSTALL_HELP[status])}
        </span>
      )}
    </div>
  );
}

const noopSubscribe = () => () => {};

const SUPPORT_HELP = {
  unconfigured: "Notifikasi belum tersedia.",
  unsupported: "Pelayar ini tidak menyokong notifikasi.",
  "ios-install":
    "Di iPhone atau iPad, pasang Hezy di skrin utama dahulu, kemudian buka Hezy dari ikon untuk menghidupkan amaran.",
} as const;

/** Suis amaran IPU untuk lokasi semasa (Web Push) dan pilihan ambang. */
function AlertRow({ prefs }: { prefs: Prefs }) {
  const { t } = useI18n();
  const location: SavedLocation | null = prefs.current;
  const threshold = effectiveThreshold(prefs);
  const profileDefault = effectiveThreshold({ ...prefs, alertThreshold: null });
  const extraCount = alertLocations(prefs).length - (location ? 1 : 0);
  const profileLabel = t(
    HEALTH_PROFILES.find((p) => p.key === prefs.profile)?.label ?? "Umum",
  );
  const support = useSyncExternalStore(noopSubscribe, pushSupport, () => null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (support !== "supported") return;
    void currentSubscription().then((sub) => setEnabled(sub !== null));
  }, [support]);

  async function toggle() {
    if (!location) return;
    setBusy(true);
    setMessage(null);
    try {
      if (enabled) {
        await disablePush();
        setEnabled(false);
      } else if (
        (await enablePush(alertLocations(prefs), threshold, prefs.lang)) ===
        "denied"
      ) {
        setMessage(
          t(
            "Kebenaran notifikasi ditolak. Benarkan notifikasi untuk Hezy dalam tetapan pelayar.",
          ),
        );
      } else {
        setEnabled(true);
      }
    } catch (error) {
      setMessage(
        t(error instanceof Error ? error.message : "Ralat tidak diketahui."),
      );
    } finally {
      setBusy(false);
    }
  }

  let content: React.ReactNode;
  if (support === null) {
    content = <div className="min-h-12" />;
  } else if (support !== "supported") {
    content = <p className="text-muted py-3">{t(SUPPORT_HELP[support])}</p>;
  } else if (!location) {
    content = (
      <p className="text-muted py-3">
        {t("Pilih lokasi dahulu untuk menerima amaran.")}
      </p>
    );
  } else {
    content = (
      <div className="flex min-h-14 items-center gap-3 py-3">
        <div className="flex-1">
          <div id="amaran-label" className="font-semibold">
            {t("Amaran bila IPU melebihi {threshold}", { threshold })}
          </div>
          <div className="text-muted mt-0.5 text-xs">
            {t("Untuk {name}", { name: t(location.name) })}
            {extraCount > 0
              ? t(" dan {count} lokasi kegemaran", { count: extraCount })
              : ""}{" "}
            · {t("disemak setiap jam")}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled === true}
          aria-labelledby="amaran-label"
          disabled={busy || enabled === null}
          onClick={() => void toggle()}
          className={`flex h-8 w-13 shrink-0 items-center rounded-full p-[3px] transition-colors disabled:opacity-50 ${
            enabled ? "justify-end bg-[#2e7d4a]" : "justify-start bg-[#8a857c]"
          }`}
        >
          <span className="size-[26px] rounded-full bg-white shadow" />
        </button>
      </div>
    );
    content = (
      <>
        {content}
        <fieldset className="border-line border-t py-3">
          <legend className="text-muted float-left mb-2 w-full text-xs font-semibold">
            {t("Ambang amaran")}
            {prefs.alertThreshold === null
              ? t(" · lalai untuk profil {profile}", { profile: profileLabel })
              : ""}
          </legend>
          <div className="bg-page grid grid-cols-3 gap-1 rounded-xl p-1">
            {([50, 100, 200] as const).map((value) => (
              <label
                key={value}
                className={`has-focus-visible:outline-ink flex min-h-11 cursor-pointer items-center justify-center rounded-lg text-sm has-focus-visible:outline-2 ${
                  threshold === value
                    ? "bg-ink text-page font-bold"
                    : "font-medium"
                }`}
              >
                <input
                  type="radio"
                  name="ambang-amaran"
                  value={value}
                  checked={threshold === value}
                  onChange={() =>
                    updatePrefs((x) => ({
                      ...x,
                      alertThreshold: value === profileDefault ? null : value,
                    }))
                  }
                  className="sr-only"
                />
                {t("IPU {threshold}", { threshold: value })}
              </label>
            ))}
          </div>
          <p className="text-muted mt-2 text-xs">
            {t(
              "50 = amaran awal (disyorkan untuk asma, kanak-kanak dan warga emas) · 100 = Tidak Sihat · 200 = Sangat Tidak Sihat",
            )}
          </p>
        </fieldset>
      </>
    );
  }

  return (
    <div className="bg-surface rounded-2xl px-4 text-sm">
      {content}
      {message && (
        <p role="alert" className="pb-3 text-xs font-semibold">
          {message}
        </p>
      )}
    </div>
  );
}
