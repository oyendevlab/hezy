"use client";

import {
  AndroidLogo,
  ArrowsClockwise,
  Baby,
  BellRinging,
  BellSlash,
  Check,
  CheckCircle,
  CircleHalf,
  Clock,
  ClockCountdown,
  Cloud,
  Desktop,
  DeviceMobile,
  Globe,
  MapPin,
  Moon,
  PaperPlaneTilt,
  PersonSimpleWalk,
  Student,
  Target,
  TrendUp,
  User,
  WifiSlash,
  Wind,
  type Icon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { shownError, type AccuracySummary } from "@/lib/accuracy";
import { HEALTH_PROFILES, type HealthProfile } from "@/lib/advice";
import { formatHour } from "@/lib/format";
import { LANGUAGES } from "@/lib/i18n";
import { promptInstall, useInstallStatus } from "@/lib/install";
import {
  alertLocations,
  effectiveThreshold,
  pushOptions,
  updatePrefs,
  usePrefs,
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
import { AboutHezy, DeveloperCredit } from "../about-hezy";
import { BottomSheet, useSheetDismiss } from "../bottom-sheet";
import { Chevron } from "../chevron";
import { InfoSheetButton } from "../info-sheet";
import { IosInstallSteps } from "../install-guide";
import { SKY_CARD, SkyHeader } from "../sky-header";
import { Skeleton } from "../status";

const THEMES: { key: ThemePref; label: string }[] = [
  { key: "system", label: "Auto" },
  { key: "light", label: "Terang" },
  { key: "dark", label: "Gelap" },
];

/** Ikon, warna dan keterangan setiap profil kesihatan (v0.7.8). */
const PROFILE_META: Record<
  HealthProfile,
  { icon: Icon; tone: string; desc: string }
> = {
  umum: {
    icon: User,
    tone: "bg-[#fbebb8] text-[#6b4f00]",
    desc: "Dewasa sihat · ambang lalai 100",
  },
  anak: {
    icon: Baby,
    tone: "bg-[#e3eefb] text-[#1f5fa8]",
    desc: "Status sekolah dipaparkan · ambang 50",
  },
  asma: {
    icon: Wind,
    tone: "bg-[#fde3dc] text-[#a33a17]",
    desc: "Nasihat lebih berhati-hati · ambang 50",
  },
  emas: {
    icon: PersonSimpleWalk,
    tone: "bg-[#e6e2f5] text-[#4b3fa0]",
    desc: "Nasihat lebih berhati-hati · ambang 50",
  },
};

const SECTION_TITLE = "text-muted mb-2 text-sm font-bold tracking-wide";
const CARD = "bg-surface divide-line divide-y rounded-[20px] px-4";

export function TetapanScreen() {
  const prefs = usePrefs();
  const { t } = useI18n();

  return (
    <>
      <SkyHeader title={t("Tetapan")} />
      <div
        className={`mx-auto flex max-w-[720px] flex-col gap-6 px-5 md:px-10 md:pt-10 ${SKY_CARD}`}
      >
        <h1 className="font-display hidden text-[30px] font-bold md:block">
          {t("Tetapan")}
        </h1>

        {prefs === null ? (
          <Skeleton className="h-96" />
        ) : (
          <>
            <ProfileSection prefs={prefs} />
            <NotificationSections prefs={prefs} />
            <DisplaySection prefs={prefs} />

            <section>
              <h2 className={SECTION_TITLE}>{t("APLIKASI")}</h2>
              <div className={CARD}>
                <InstallRow />
              </div>
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className={`${SECTION_TITLE} mb-0`}>{t("TENTANG DATA")}</h2>
                <InfoSheetButton
                  title={t("Tentang data")}
                  label={t("Tentang data Hezy")}
                  testId="info-data"
                  rows={[
                    {
                      icon: MapPin,
                      text: "Stesen APIMS dalam 30 km (bacaan 3 jam terakhir): IPU rasmi, dan ramalan model dibetulkan dengan bacaan itu",
                    },
                    {
                      icon: Cloud,
                      text: "Tiada stesen: anggaran daripada PM2.5 model (formula JAS), mungkin berbeza daripada bacaan rasmi",
                    },
                    {
                      icon: Target,
                      text: "Ketepatan: ralat purata 14 hari berbanding bacaan rasmi; ramalan esok dinilai setiap malam",
                    },
                    {
                      icon: WifiSlash,
                      text: "Luar talian: bacaan terakhir disimpan di peranti",
                    },
                  ]}
                />
              </div>
              <div className={`${CARD} text-sm`}>
                <Row
                  label={t("Bacaan rasmi")}
                  value={t("APIMS (JAS), stesen ≤ 30 km")}
                />
                <Row label={t("Ramalan")} value="Open-Meteo (CAMS)" />
                <Row
                  label={t("Cuaca rasmi")}
                  value="MetMalaysia (data.gov.my)"
                />
                <AccuracyRows />
              </div>
            </section>

            <AboutHezy />
            <DeveloperCredit />

            <p className="text-muted text-center text-[11px]">
              {t("© 2026 Hezy · Data rasmi APIMS (JAS)")}
            </p>
          </>
        )}
      </div>
    </>
  );
}

/** Kotak ikon berwarna di kiri baris tetapan. */
function IconBox({ icon: I, tone }: { icon: Icon; tone: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-9 shrink-0 items-center justify-center rounded-[11px] ${tone}`}
    >
      <I size={19} weight="bold" />
    </span>
  );
}

/** Suis (checkbox role=switch); input menutupi trek supaya mudah diketik. */
function Switch({
  id,
  checked,
  onChange,
  disabled = false,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <span className="relative inline-flex shrink-0">
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer absolute inset-0 z-10 size-full cursor-pointer appearance-none rounded-full opacity-0 disabled:cursor-not-allowed"
      />
      <span
        aria-hidden="true"
        className="bg-muted/40 peer-checked:bg-toggle peer-focus-visible:outline-ink relative h-7 w-12 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-disabled:opacity-50 after:absolute after:top-[3px] after:left-[3px] after:size-[22px] after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
      />
    </span>
  );
}

/** Baris berikon dengan tajuk, keterangan dan suis (label = tajuk + keterangan). */
function SwitchRow({
  icon,
  tone,
  title,
  desc,
  checked,
  onChange,
  disabled,
  action,
}: {
  icon: Icon;
  tone: string;
  title: string;
  desc?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Butang kecil di sebelah tajuk, cth. ⓘ. */
  action?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex min-h-15 items-center gap-3 py-2">
      <IconBox icon={icon} tone={tone} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-0.5">
          <label htmlFor={id} className="cursor-pointer text-[15px] font-bold">
            {title}
          </label>
          {action}
        </div>
        {desc && (
          <label
            htmlFor={id}
            className="text-muted block cursor-pointer text-xs"
          >
            {desc}
          </label>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

/** Kumpulan pilihan segmen (radio); `compact` untuk baris Tema/Bahasa. */
function Segmented<T extends string | number>({
  name,
  options,
  value,
  onChange,
  compact = false,
}: {
  name: string;
  options: { value: T; label: string; ariaLabel?: string; lang?: string }[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`bg-page grid gap-1 rounded-[14px] p-1 ${compact ? "grid-flow-col" : ""}`}
      style={
        compact
          ? undefined
          : {
              gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
            }
      }
    >
      {options.map((o) => (
        <label
          key={String(o.value)}
          lang={o.lang}
          className={`has-focus-visible:outline-ink relative flex cursor-pointer items-center justify-center rounded-[10px] text-center font-bold has-focus-visible:outline-2 ${
            compact ? "min-h-9 px-2.5 text-xs" : "min-h-11 px-1.5 text-[13px]"
          } ${value === o.value ? "bg-pick text-pick-ink" : "text-muted"}`}
        >
          <input
            type="radio"
            name={name}
            value={String(o.value)}
            checked={value === o.value}
            aria-label={o.ariaLabel}
            onChange={() => onChange(o.value)}
            className="absolute inset-0 cursor-pointer appearance-none opacity-0"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

function ProfileSection({ prefs }: { prefs: Prefs }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const current =
    HEALTH_PROFILES.find((p) => p.key === prefs.profile) ?? HEALTH_PROFILES[0];
  const meta = PROFILE_META[current.key];
  const schoolForced = prefs.profile === "anak";
  return (
    <section>
      <h2 className={SECTION_TITLE}>{t("PROFIL KESIHATAN")}</h2>
      <div className={CARD}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={t("Profil kesihatan: {profile}", {
            profile: t(current.label),
          })}
          className="flex min-h-15 w-full items-center gap-3 py-2 text-left"
        >
          <IconBox icon={meta.icon} tone={meta.tone} />
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold">
              {t(current.label)}
            </span>
            <span className="text-muted block text-xs">{t(meta.desc)}</span>
          </span>
          <Chevron />
        </button>
        <SwitchRow
          icon={Student}
          tone="bg-[#e3eefb] text-[#1f5fa8]"
          title={t("Papar status sekolah")}
          desc={
            schoolForced
              ? t("Sentiasa untuk profil Kanak-kanak")
              : t("Kad di Utama dan Trend")
          }
          checked={schoolForced || prefs.showSchool}
          disabled={schoolForced}
          onChange={(on) => updatePrefs((x) => ({ ...x, showSchool: on }))}
        />
      </div>
      {open && (
        <BottomSheet
          title={t("Profil kesihatan")}
          description={t(
            "Nasihat di skrin Utama disesuaikan mengikut profil ini.",
          )}
          testId="profile-sheet"
          onClose={() => setOpen(false)}
        >
          <ProfileOptions prefs={prefs} />
        </BottomSheet>
      )}
    </section>
  );
}

function ProfileOptions({ prefs }: { prefs: Prefs }) {
  const { t } = useI18n();
  const dismiss = useSheetDismiss();
  return (
    <div role="radiogroup" className="flex flex-col gap-2">
      {HEALTH_PROFILES.map((p) => {
        const meta = PROFILE_META[p.key];
        const on = prefs.profile === p.key;
        return (
          <label
            key={p.key}
            className={`bg-surface has-focus-visible:outline-ink relative flex min-h-15 cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 has-focus-visible:outline-2 ${
              on ? "ring-ink ring-2 ring-inset" : ""
            }`}
          >
            <input
              type="radio"
              name="profile"
              value={p.key}
              checked={on}
              aria-label={t(p.label)}
              onChange={() => {
                updatePrefs((x) => ({ ...x, profile: p.key }));
                dismiss();
              }}
              className="absolute inset-0 cursor-pointer appearance-none rounded-2xl opacity-0"
            />
            <IconBox icon={meta.icon} tone={meta.tone} />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold">{t(p.label)}</span>
              <span className="text-muted block text-xs">{t(meta.desc)}</span>
            </span>
            {on && (
              <CheckCircle
                aria-hidden="true"
                size={22}
                weight="fill"
                className="shrink-0"
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

function DisplaySection({ prefs }: { prefs: Prefs }) {
  const { t } = useI18n();
  return (
    <section>
      <h2 className={SECTION_TITLE}>{t("PAPARAN")}</h2>
      <div className={CARD}>
        <div className="flex min-h-15 items-center gap-3 py-2">
          <IconBox icon={CircleHalf} tone="bg-page text-ink" />
          <span id="tema" className="flex-1 text-[15px] font-bold">
            {t("Tema")}
          </span>
          <div role="radiogroup" aria-labelledby="tema">
            <Segmented
              compact
              name="theme"
              value={prefs.theme}
              onChange={(theme) => updatePrefs((x) => ({ ...x, theme }))}
              options={THEMES.map((th) => ({
                value: th.key,
                label: t(th.label),
                ariaLabel: th.key === "system" ? t("Ikut peranti") : undefined,
              }))}
            />
          </div>
        </div>
        <div className="flex min-h-15 items-center gap-3 py-2">
          <IconBox icon={Globe} tone="bg-page text-ink" />
          <span id="bahasa" className="flex-1 text-[15px] font-bold">
            {t("Bahasa")}
          </span>
          <div role="radiogroup" aria-labelledby="bahasa">
            <Segmented
              compact
              name="lang"
              value={prefs.lang}
              onChange={(lang) => updatePrefs((x) => ({ ...x, lang }))}
              options={LANGUAGES.map((l) => ({
                value: l.key,
                label: l.key === "ms" ? "BM" : "EN",
                ariaLabel: l.label,
                lang: l.key,
              }))}
            />
          </div>
        </div>
      </div>
    </section>
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
  manual:
    "Buka menu pelayar dan pilih “Pasang aplikasi” atau “Tambah ke skrin utama”.",
} as const;

function InstallRow() {
  const { t } = useI18n();
  const status = useInstallStatus();
  const [guide, setGuide] = useState(false);
  if (status === null) return <div className="min-h-15" />;
  if (status === "installed") {
    return (
      <div className="flex min-h-15 items-center gap-3 py-2">
        <IconBox icon={CheckCircle} tone="bg-[#dff0d4] text-[#2f6b1f]" />
        <span className="flex-1 text-[15px] font-bold">
          {t("Hezy dipasang")}
        </span>
        <span className="text-muted text-sm">{t("Skrin utama")}</span>
      </div>
    );
  }
  return (
    <div className="py-2 text-sm">
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-3">
        <span className="text-[15px] font-bold">{t("Pasang Hezy")}</span>
        {status === "available" ? (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="bg-ink text-page min-h-11 rounded-xl px-4 text-sm font-semibold"
          >
            {t("Pasang")}
          </button>
        ) : status === "ios" ? (
          <button
            type="button"
            aria-expanded={guide}
            aria-controls="panduan-pasang"
            onClick={() => setGuide((g) => !g)}
            className="bg-ink text-page min-h-11 rounded-xl px-4 text-sm font-semibold"
          >
            {guide ? t("Tutup panduan") : t("Cara pasang")}
          </button>
        ) : (
          <span className="text-muted max-w-[60%] text-right">
            {t(INSTALL_HELP[status])}
          </span>
        )}
      </div>
      {status === "ios" && guide && <IosInstallSteps id="panduan-pasang" />}
    </div>
  );
}

const noopSubscribe = () => () => {};

const SUPPORT_HELP = {
  unconfigured: "Notifikasi belum tersedia.",
  unsupported: "Pelayar ini tidak menyokong notifikasi.",
  "ios-install":
    "Di iPhone atau iPad, pasang Hezy di skrin utama dahulu, kemudian buka Hezy dari ikon untuk menghidupkan notifikasi.",
} as const;

/** Ikon lencana (segi empat dengan titik merah) untuk "Nombor IPU pada ikon". */
function BadgeGlyph({ size = 19 }: { size?: number | string }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <rect x="3" y="6" width="15" height="15" rx="4" />
      <circle cx="18" cy="6" r="3.5" fill="#d93a3f" stroke="none" />
    </svg>
  );
}
const BadgeIcon = BadgeGlyph as unknown as Icon;

/**
 * NOTIFIKASI (cara Hezy memberitahu: banner Web Push, waktu senyap, nombor pada ikon) dan
 * AMARAN (bila memberitahu: ambang, amaran awal, lonjakan), v0.7.8.
 */
function NotificationSections({ prefs }: { prefs: Prefs }) {
  const { t } = useI18n();
  const location: SavedLocation | null = prefs.current;
  const threshold = effectiveThreshold(prefs);
  const profileDefault = effectiveThreshold({ ...prefs, alertThreshold: null });
  const locations = alertLocations(prefs);
  const extraCount = locations.length - (location ? 1 : 0);
  const profileLabel = t(
    HEALTH_PROFILES.find((p) => p.key === prefs.profile)?.label ?? "Umum",
  );
  const support = useSyncExternalStore(noopSubscribe, pushSupport, () => null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [quietOpen, setQuietOpen] = useState(false);

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
        (await enablePush(
          locations,
          threshold,
          prefs.lang,
          pushOptions(prefs),
        )) === "denied"
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

  const hourLabel = (h: number) =>
    formatHour(`2026-01-01T${String(h).padStart(2, "0")}:00`, prefs.lang);
  const quiet = prefs.quietHours;
  const early = prefs.forecastAlert || prefs.expectedAlert;

  let banner: React.ReactNode;
  if (support === null) {
    banner = <div className="min-h-15" />;
  } else if (support !== "supported") {
    banner = (
      <div className="flex min-h-15 items-center gap-3 py-2">
        <IconBox icon={BellSlash} tone="bg-page text-muted" />
        <p className="text-muted flex-1 text-sm">{t(SUPPORT_HELP[support])}</p>
      </div>
    );
  } else if (!location) {
    banner = (
      <div className="flex min-h-15 items-center gap-3 py-2">
        <IconBox icon={BellSlash} tone="bg-page text-muted" />
        <p className="text-muted flex-1 text-sm">
          {t("Pilih lokasi dahulu untuk menerima notifikasi.")}
        </p>
      </div>
    );
  } else {
    banner = (
      <SwitchRow
        icon={BellRinging}
        tone="bg-ink text-page"
        title={t("Banner notifikasi")}
        desc={`${t("Untuk {name}", { name: t(location.name) })}${
          extraCount > 0
            ? t(" dan {count} lokasi kegemaran", { count: extraCount })
            : ""
        }`}
        checked={enabled === true}
        disabled={busy || enabled === null}
        onChange={() => void toggle()}
      />
    );
  }

  return (
    <>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className={`${SECTION_TITLE} mb-0`}>
            {t("NOTIFIKASI DAN AMARAN")}
          </h2>
          {enabled && (
            <InfoSheetButton
              title={t("Ambang amaran")}
              label={t("Tentang ambang amaran")}
              testId="info-threshold"
              rows={[
                {
                  icon: Target,
                  text: "IPU 50: amaran awal, disyorkan untuk asma, kanak-kanak dan warga emas",
                },
                { icon: Target, text: "IPU 100: Tidak Sihat" },
                { icon: Target, text: "IPU 200: Sangat Tidak Sihat" },
                {
                  icon: Clock,
                  text: "Disemak setiap jam; paling kerap satu amaran setiap 6 jam bagi setiap lokasi",
                },
              ]}
            />
          )}
        </div>
        <div className={CARD}>
          <SwitchRow
            icon={BadgeIcon}
            tone="bg-page text-ink"
            title={t("Nombor pada ikon")}
            desc={t("IPU semasa pada ikon Hezy")}
            checked={prefs.iconBadge}
            onChange={(on) => updatePrefs((x) => ({ ...x, iconBadge: on }))}
            action={
              <InfoSheetButton
                title={t("Nombor IPU pada ikon")}
                label={t("Tentang nombor IPU pada ikon")}
                testId="info-badge"
                rows={[
                  {
                    icon: DeviceMobile,
                    text: "iPhone: Hezy dipasang ke Skrin Utama (iOS 16.4 ke atas)",
                  },
                  {
                    icon: ArrowsClockwise,
                    text: "Dikemas kini bila Hezy dibuka atau notifikasi diterima",
                  },
                  {
                    icon: AndroidLogo,
                    text: "Android: kebanyakan telefon menunjukkan titik, bukan nombor",
                  },
                  {
                    icon: Desktop,
                    text: "Komputer: Chrome dan Edge (aplikasi dipasang)",
                  },
                ]}
              />
            }
          />
          {banner}
          {/* Tetapan amaran hanya dipaparkan bila banner hidup (v0.7.13). */}
          {enabled && (
            <div
              data-testid="alert-settings"
              className="sheet-reveal divide-line divide-y"
            >
              <OptionBlock
                title={t("Waktu hantaran")}
                desc={t("Amaran bila perlu, atau tambah ringkasan pagi")}
              >
                <Segmented
                  name="kekerapan"
                  value={prefs.morningSummary ? "pagi" : "amaran"}
                  onChange={(v) =>
                    updatePrefs((x) => ({ ...x, morningSummary: v === "pagi" }))
                  }
                  options={[
                    { value: "amaran", label: t("Amaran sahaja") },
                    { value: "pagi", label: t("+ Ringkasan 7 AM") },
                  ]}
                />
              </OptionBlock>
              <OptionBlock
                title={t("Ambang amaran")}
                desc={
                  prefs.alertThreshold === null
                    ? t("Lalai untuk profil {profile}", {
                        profile: profileLabel,
                      })
                    : t("Dipilih sendiri · lalai IPU {threshold}", {
                        threshold: profileDefault,
                      })
                }
              >
                <Segmented
                  name="ambang-amaran"
                  value={threshold}
                  onChange={(value) =>
                    updatePrefs((x) => ({
                      ...x,
                      alertThreshold: value === profileDefault ? null : value,
                    }))
                  }
                  options={([50, 100, 200] as const).map((value) => ({
                    value,
                    label: t("IPU {threshold}", { threshold: value }),
                  }))}
                />
              </OptionBlock>
              <SwitchRow
                icon={ClockCountdown}
                tone="bg-[#fde3dc] text-[#a33a17]"
                title={t("Amaran awal")}
                desc={t("Jerebu dijangka dalam 6 jam atau esok")}
                checked={early}
                onChange={(on) =>
                  updatePrefs((x) => ({
                    ...x,
                    forecastAlert: on,
                    expectedAlert: on,
                  }))
                }
              />
              <SwitchRow
                icon={TrendUp}
                tone="bg-[#fbebb8] text-[#6b4f00]"
                title={t("Lonjakan mendadak")}
                desc={t("Naik 30 atau lebih dalam 3 jam")}
                checked={prefs.spikeAlert}
                onChange={(on) =>
                  updatePrefs((x) => ({ ...x, spikeAlert: on }))
                }
              />
              <button
                type="button"
                onClick={() => setQuietOpen(true)}
                aria-haspopup="dialog"
                className="flex min-h-15 w-full items-center gap-3 py-2 text-left"
              >
                <IconBox icon={Moon} tone="bg-[#e6e2f5] text-[#4b3fa0]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold">
                    {t("Waktu senyap")}
                  </span>
                  <span className="text-muted block text-xs">
                    {quiet
                      ? `${hourLabel(quiet.start)} – ${hourLabel(quiet.end)}`
                      : t("Mati")}
                  </span>
                </span>
                <Chevron />
              </button>
              <Link
                href="/lokasi#senarai"
                className="flex min-h-15 items-center gap-3 py-2"
              >
                <IconBox icon={MapPin} tone="bg-[#dff0d4] text-[#2f6b1f]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold">
                    {t("Lokasi amaran")}
                  </span>
                  <span className="text-muted block truncate text-xs">
                    {locations.length > 0
                      ? locations.map((l) => t(l.name)).join(", ")
                      : t("Belum dipilih")}
                  </span>
                </span>
                <Chevron />
              </Link>
              <TestNotification />
            </div>
          )}
        </div>
        {message && (
          <p role="alert" className="mt-2 text-xs font-semibold">
            {message}
          </p>
        )}
      </section>

      {quietOpen && (
        <BottomSheet
          title={t("Waktu senyap")}
          description={t(
            "Amaran ditangguh hingga waktu senyap tamat, kecuali IPU melebihi 300",
          )}
          testId="quiet-sheet"
          onClose={() => setQuietOpen(false)}
        >
          <QuietHoursOptions prefs={prefs} hourLabel={hourLabel} />
        </BottomSheet>
      )}
    </>
  );
}

/** Kumpulan pilihan dengan tajuk dan keterangan (Waktu hantaran, Ambang amaran). */
function OptionBlock({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-labelledby={id} className="py-3">
      <div id={id} className="mb-2.5">
        <span className="block text-[15px] font-bold">{title}</span>
        {desc && <span className="text-muted block text-xs">{desc}</span>}
      </div>
      {children}
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, h) => h);

function QuietHoursOptions({
  prefs,
  hourLabel,
}: {
  prefs: Prefs;
  hourLabel: (h: number) => string;
}) {
  const { t } = useI18n();
  const quiet = prefs.quietHours;
  const select =
    "border-line bg-page min-h-11 w-full rounded-xl border px-3 text-base font-semibold";
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-surface rounded-2xl px-3">
        <SwitchRow
          icon={Moon}
          tone="bg-[#e6e2f5] text-[#4b3fa0]"
          title={t("Hidupkan waktu senyap")}
          checked={quiet !== null}
          onChange={(on) =>
            updatePrefs((x) => ({
              ...x,
              quietHours: on ? { start: 23, end: 6 } : null,
            }))
          }
        />
      </div>
      {quiet && (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-bold">
            <span className="text-muted">{t("Dari")}</span>
            <select
              aria-label={t("Waktu senyap bermula")}
              value={quiet.start}
              onChange={(e) => {
                const start = Number(e.target.value);
                if (start === quiet.end) return;
                updatePrefs((x) => ({
                  ...x,
                  quietHours: { start, end: quiet.end },
                }));
              }}
              className={select}
            >
              {HOURS.map((h) => (
                <option key={h} value={h} disabled={h === quiet.end}>
                  {hourLabel(h)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold">
            <span className="text-muted">{t("Hingga")}</span>
            <select
              aria-label={t("Waktu senyap tamat")}
              value={quiet.end}
              onChange={(e) => {
                const end = Number(e.target.value);
                if (end === quiet.start) return;
                updatePrefs((x) => ({
                  ...x,
                  quietHours: { start: quiet.start, end },
                }));
              }}
              className={select}
            >
              {HOURS.map((h) => (
                <option key={h} value={h} disabled={h === quiet.start}>
                  {hourLabel(h)}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}

/** Hantar satu notifikasi ujian ke peranti ini (tidak mengubah status amaran). */
function TestNotification() {
  const { t } = useI18n();
  const [state, setState] = useState<
    { status: "idle" | "busy" | "sent" } | { status: "error"; message: string }
  >({ status: "idle" });

  async function send() {
    setState({ status: "busy" });
    try {
      const subscription = await currentSubscription();
      if (!subscription)
        throw new Error(
          "Langganan tidak dijumpai. Matikan dan hidupkan semula amaran.",
        );
      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        retryAfter?: number;
      };
      if (res.status === 429) {
        setState({
          status: "error",
          message: t("Tunggu {seconds} saat sebelum menghantar lagi.", {
            seconds: body.retryAfter ?? 60,
          }),
        });
        return;
      }
      if (!res.ok) throw new Error(body.error ?? `Status ${res.status}`);
      setState({ status: "sent" });
    } catch (error) {
      setState({
        status: "error",
        message: t(
          error instanceof TypeError
            ? "Tiada sambungan internet."
            : error instanceof Error
              ? error.message
              : "Ralat tidak diketahui.",
        ),
      });
    }
  }

  const sent = state.status === "sent";
  return (
    <div className="flex min-h-15 items-center gap-3 py-2">
      <IconBox icon={PaperPlaneTilt} tone="bg-page text-ink" />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold">
          {t("Notifikasi ujian")}
        </span>
        <span role="status" className="text-muted block text-xs">
          {sent
            ? t("Dihantar. Notifikasi sepatutnya muncul dalam beberapa saat.")
            : state.status === "error"
              ? state.message
              : t("Semak amaran sampai ke peranti ini")}
        </span>
      </span>
      <button
        type="button"
        onClick={() => void send()}
        disabled={state.status === "busy"}
        aria-label={t("Hantar notifikasi ujian")}
        className="bg-pick text-pick-ink flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold disabled:opacity-60"
      >
        {sent && <Check aria-hidden="true" size={14} weight="bold" />}
        {state.status === "busy"
          ? t("Menghantar…")
          : sent
            ? t("Hantar lagi")
            : t("Hantar")}
      </button>
    </div>
  );
}

/** Ketepatan 14 hari (kebangsaan) daripada /api/accuracy. */
function AccuracyRows() {
  const { t } = useI18n();
  const [summary, setSummary] = useState<AccuracySummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/accuracy")
      .then((res) => (res.ok ? res.json() : null))
      .then((body: AccuracySummary | null) => {
        if (!cancelled && body) setSummary(body);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!summary) return null;
  // Ramalan dipaparkan dengan model E sejak v0.8.7.
  const forecast = shownError(summary, "forecastJas");
  return (
    <>
      <Row
        label={t("Ketepatan anggaran")}
        value={
          summary.estimate === null
            ? t("Sedang dikumpul")
            : t("±{n} IPU", { n: summary.estimate })
        }
      />
      <Row
        label={t("Ketepatan ramalan esok")}
        value={
          forecast !== null
            ? t("±{n} IPU (model asal ±{raw})", {
                n: forecast,
                raw: summary.forecastRaw ?? "–",
              })
            : t("Sedang dikumpul")
        }
      />
    </>
  );
}
