"use client";

import Link from "next/link";
import { shownError } from "@/lib/accuracy";
import { HEALTH_PROFILES, adviceFor, type QuickTone } from "@/lib/advice";
import { CATEGORY_STYLE, NEUTRAL_SKY } from "@/lib/category-style";
import { formatChange, formatClock } from "@/lib/format";
import { primaryReading } from "@/lib/official";
import type { Prefs, SavedLocation } from "@/lib/prefs";
import type { Reading } from "@/lib/reading";
import { buildSharePath } from "@/lib/share";
import { useI18n } from "@/lib/use-i18n";
import { useReading, type ReadingEntry } from "@/lib/use-reading";
import { ChooseLocation } from "../choose-location";
import { IpuPill } from "../ipu-pill";
import { Logo } from "../logo";
import { SchoolCard } from "../school-card";
import { PullToRefresh } from "../pull-to-refresh";
import { ReadingNotices } from "../reading-notices";
import { RefreshButton } from "../refresh-button";
import { ShareButton } from "../share-button";
import { Skyline } from "../skyline";
import { Notice, Skeleton } from "../status";
import { TrendPanel } from "../trend-panel";
import { useCurrent } from "../use-current";

export function HomeScreen() {
  const { prefs, location, entry, refresh } = useCurrent();

  if (prefs === null) return <HomeSkeleton />;
  if (!location) return <Welcome />;
  return (
    <HomeView
      prefs={prefs}
      location={location}
      entry={entry}
      onRetry={refresh}
    />
  );
}

function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 pt-13 md:px-10 md:pt-10">
      <Skeleton className="h-[320px] md:h-[380px]" />
      <Skeleton className="mt-4 h-24" />
    </div>
  );
}

function Welcome() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-md px-5 pt-13 md:pt-16">
      <Logo size={72} className="mb-4" />
      <h1 className="font-display text-[32px] leading-tight font-bold">
        {t("Selamat datang ke Hezy")}
      </h1>
      <p className="text-muted mt-2 text-[16px]">
        {t(
          "Pilih lokasi untuk melihat Indeks Pencemar Udara (IPU) dan nasihat kesihatan.",
        )}
      </p>
      <div className="mt-6">
        <ChooseLocation />
      </div>
    </div>
  );
}

type ViewProps = {
  prefs: Prefs;
  location: SavedLocation;
  entry: ReadingEntry | undefined;
  onRetry: () => void;
};

function HomeView({ prefs, location, entry, onRetry }: ViewProps) {
  const { t } = useI18n();
  const reading = entry?.reading;
  const current = primaryReading(reading);
  const showSchool = prefs.profile === "anak" || prefs.showSchool;
  const palette = current ? CATEGORY_STYLE[current.category].sky : NEUTRAL_SKY;
  const shareText = current
    ? t("IPU {name}: {ipu} ({label}) · via Hezy", {
        name: t(location.name),
        ipu: current.ipu,
        label: t(current.label),
      })
    : t("Hezy — semak jerebu");
  const sharePath = current
    ? buildSharePath({
        name: location.name,
        ipu: current.ipu,
        source: current.source,
      })
    : "/";

  return (
    <>
      <PullToRefresh />
      {/* Telefon: mockup C */}
      <section className="md:hidden">
        <div className="relative h-[440px]">
          <Skyline
            variant="phone"
            palette={palette}
            className="absolute inset-0 h-full w-full"
          />
          <div className="absolute inset-x-5 top-13 flex items-center justify-between">
            <LocationLink location={location} />
            <ShareButton
              text={shareText}
              path={sharePath}
              className="bg-white/70 text-[#1c1a16]"
            />
          </div>
        </div>
        <div className="bg-page relative -mt-8 flex flex-col gap-4 rounded-t-[28px] px-5.5 pt-6">
          <Summary
            entry={entry}
            reading={reading}
            onRetry={onRetry}
            size="phone"
            profile={prefs.profile}
          />
          {current && showSchool && <SchoolCard reading={current} />}
        </div>
      </section>

      {/* Tablet & desktop: pilihan 2 */}
      <section className="hidden md:block">
        <div className="relative h-[420px] overflow-hidden">
          <Skyline
            variant="panorama"
            palette={palette}
            className="absolute inset-0 h-full w-full"
          />
          <div className="absolute inset-x-0 top-6">
            <div className="mx-auto flex max-w-[1200px] items-center justify-between px-10">
              <LocationLink location={location} />
              <div className="flex items-center gap-2">
                <RefreshButton className="inline-flex border-transparent bg-white/70 text-[#1c1a16] hover:bg-white" />
                <ShareButton
                  text={shareText}
                  path={sharePath}
                  className="bg-white/70 text-[#1c1a16]"
                />
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-16">
            <div className="mx-auto max-w-[1200px] px-10">
              <div className="bg-page inline-flex max-w-[560px] flex-col gap-2 rounded-[28px] px-7 py-6">
                <Headline
                  reading={reading}
                  entry={entry}
                  size="desktop"
                  profile={prefs.profile}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto -mt-9 flex max-w-[1200px] flex-wrap gap-5 px-10">
          <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-5">
            {entry && <ReadingNotices entry={entry} onRetry={onRetry} />}
            {current && showSchool && <SchoolCard reading={current} />}
            {current && <QuickAnswers category={current.category} />}
            {current && (
              <AdviceCard category={current.category} profile={prefs.profile} />
            )}
            {!reading && entry?.status === "error" && (
              <Notice action={{ label: t("Cuba lagi"), onClick: onRetry }}>
                {t(entry.error ?? "")}
              </Notice>
            )}
          </div>
          <section className="border-line bg-page min-w-0 flex-[1.6_1_480px] rounded-3xl border-[1.5px] p-5.5">
            {reading ? (
              <TrendPanel reading={reading} barHeight={190} />
            ) : (
              <Skeleton className="h-[380px]" />
            )}
          </section>
        </div>

        <FavouriteStrip favourites={prefs.favourites} />
      </section>
    </>
  );
}

function LocationLink({ location }: { location: SavedLocation }) {
  const { t } = useI18n();
  return (
    <Link
      href="/lokasi"
      className="flex min-h-11 items-center gap-1.5 rounded-full bg-white/70 px-3.5 text-base font-semibold text-[#1c1a16]"
    >
      <svg
        aria-hidden="true"
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
      {t(location.name)}
      <span className="sr-only">{t("— tukar lokasi")}</span>
      <svg
        aria-hidden="true"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </Link>
  );
}

type SummaryProps = {
  entry: ReadingEntry | undefined;
  reading: Reading | undefined;
  onRetry: () => void;
  size: "phone" | "desktop";
  profile: Prefs["profile"];
};

function Summary({ entry, reading, onRetry, size, profile }: SummaryProps) {
  const { t } = useI18n();
  const current = primaryReading(reading);

  if (!reading && entry?.status === "error") {
    return (
      <Notice action={{ label: t("Cuba lagi"), onClick: onRetry }}>
        {t(entry.error ?? "")}
      </Notice>
    );
  }

  const advice = current ? adviceFor(current.category, profile) : null;
  return (
    <>
      <Headline reading={reading} entry={entry} size={size} profile={profile} />
      {entry && <ReadingNotices entry={entry} onRetry={onRetry} />}
      {advice && (
        <ul className="grid auto-cols-fr grid-flow-col gap-2">
          {advice.tips.slice(0, 3).map((tip) => (
            <li
              key={tip}
              className="bg-surface flex min-h-[72px] flex-col justify-between gap-1.5 rounded-2xl p-3 text-[13px] leading-snug font-semibold"
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ background: CATEGORY_STYLE[current!.category].accent }}
              />
              {t(tip)}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Headline({
  reading,
  entry,
  size,
  profile,
}: Omit<SummaryProps, "onRetry">) {
  const { t, lang } = useI18n();
  const current = primaryReading(reading);
  if (!reading) {
    return (
      <div aria-busy="true" className="flex flex-col gap-3">
        <Skeleton className="h-20 w-48" />
        <Skeleton className="h-6 w-64" />
      </div>
    );
  }
  if (!current) {
    return (
      <p className="text-[15px] font-semibold">
        {t("Data kualiti udara belum tersedia untuk lokasi ini.")}
      </p>
    );
  }

  // Perubahan 3 jam dikira daripada model, jadi hanya dipaparkan bila nombor utama ialah anggaran model.
  const change =
    current.source === "model" ? formatChange(reading.change3h, lang) : null;
  const official = reading.official;
  const estimateError = shownError(reading.accuracy, "estimate");
  const big = size === "desktop" ? "text-[112px]" : "text-[84px]";
  return (
    <>
      <div className="flex items-center gap-4">
        <h1
          aria-label={t("IPU {ipu}, {label}", {
            ipu: current.ipu,
            label: t(current.label),
          })}
          className={`font-display ${big} leading-[0.9] font-bold tracking-[-0.04em] tabular-nums`}
        >
          {current.ipu}
        </h1>
        <div className="flex flex-col items-start gap-1.5">
          <IpuPill category={current.category} label={t(current.label)} />
          {change && (
            <span className="text-muted text-[13px] font-semibold">
              {change}
            </span>
          )}
          {entry?.status === "loading" && (
            <span className="text-muted text-xs">{t("Mengemas kini…")}</span>
          )}
        </div>
      </div>
      {current.emergency && (
        <Notice tone="warning">
          {t(
            "IPU melebihi 500: tahap Kecemasan. Ikut arahan Majlis Keselamatan Negara.",
          )}
        </Notice>
      )}
      <p
        className={`font-display font-semibold ${size === "desktop" ? "text-[26px]" : "text-[22px]"} leading-snug`}
      >
        {t(adviceFor(current.category, profile).headline)}
      </p>
      {official ? (
        <p className="text-muted text-xs font-medium">
          {t("Rasmi APIMS · Stesen {station} ({km} km)", {
            station: official.stationName,
            km: official.distanceKm,
          })}
          {official.pollutant ? ` · ${official.pollutant}` : ""} ·{" "}
          {formatClock(official.time, lang)}
          {reading.current
            ? ` · ${t("Anggaran model: {ipu}", { ipu: reading.current.ipu })}`
            : ""}
        </p>
      ) : (
        <p className="text-muted text-xs font-medium">
          {t(
            "Dikemas kini {time} · Anggaran daripada PM2.5 (Open-Meteo); tiada stesen APIMS berdekatan",
            { time: formatClock(current.time, lang) },
          )}
          {estimateError !== null &&
            ` · ${t("biasanya ±{n} berbanding bacaan rasmi", { n: estimateError })}`}
        </p>
      )}
    </>
  );
}

const TONE_CLASS: Record<QuickTone, string> = {
  ya: "bg-ipu-sederhana-tint text-ipu-sederhana-ink",
  berhati: "bg-ipu-tidak-sihat-tint text-ipu-tidak-sihat-ink",
  tidak: "bg-ipu-berbahaya-tint text-ipu-berbahaya-ink",
};

function QuickAnswers({
  category,
}: {
  category: Parameters<typeof adviceFor>[0];
}) {
  const { t } = useI18n();
  return (
    <section className="border-line bg-page rounded-3xl border-[1.5px] p-5.5">
      <h2 className="font-display text-[22px] font-bold">
        {t("Boleh keluar hari ini?")}
      </h2>
      <dl className="divide-line mt-2 divide-y">
        {adviceFor(category).quick.map((q) => (
          <div
            key={q.question}
            className="flex min-h-13 items-center justify-between gap-3"
          >
            <dt className="text-[15px] font-medium">{t(q.question)}</dt>
            <dd
              className={`rounded-full px-3 py-1.5 text-[13px] font-bold whitespace-nowrap ${TONE_CLASS[q.tone]}`}
            >
              {t(q.answer)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function AdviceCard({
  category,
  profile,
}: {
  category: Parameters<typeof adviceFor>[0];
  profile: Prefs["profile"];
}) {
  const { t } = useI18n();
  const label = t(
    HEALTH_PROFILES.find((p) => p.key === profile)?.label ?? "Umum",
  );
  return (
    <section className="bg-surface rounded-3xl p-5.5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-[22px] font-bold">
          {t("Nasihat · {profile}", { profile: label })}
        </h2>
        <Link href="/tetapan" className="text-sm font-semibold underline">
          {t("Tukar profil")}
        </Link>
      </div>
      <ul className="mt-3 flex flex-col gap-2.5">
        {adviceFor(category, profile).tips.map((tip) => (
          <li
            key={tip}
            className="flex items-center gap-2.5 text-[15px] font-semibold"
          >
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full ${CATEGORY_STYLE[category].tint}`}
            >
              <svg
                aria-hidden="true"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="5 12 10 17 19 7" />
              </svg>
            </span>
            {t(tip)}
          </li>
        ))}
      </ul>
    </section>
  );
}

function FavouriteStrip({ favourites }: { favourites: SavedLocation[] }) {
  const { t } = useI18n();
  if (favourites.length === 0) return null;
  return (
    <section className="mx-auto mt-7 max-w-[1200px] px-10">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-[22px] font-bold">
          {t("Lokasi kegemaran")}
        </h2>
        <Link href="/lokasi" className="text-sm font-semibold underline">
          {t("Urus lokasi")}
        </Link>
      </div>
      <ul className="mt-3 flex flex-wrap gap-3">
        {favourites.map((f) => (
          <FavouriteMini key={f.id} location={f} />
        ))}
      </ul>
    </section>
  );
}

function FavouriteMini({ location }: { location: SavedLocation }) {
  const { t } = useI18n();
  const { entry } = useReading(location);
  const current = primaryReading(entry?.reading);
  return (
    <li className="bg-surface min-h-24 flex-[1_1_170px] rounded-[18px] px-4 py-3.5">
      <div className="text-muted text-xs font-semibold">{t(location.name)}</div>
      {current ? (
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display text-[32px] font-bold">
            {current.ipu}
          </span>
          <IpuPill
            category={current.category}
            label={t(current.label)}
            className="!px-2 !text-[11px]"
          />
        </div>
      ) : (
        <Skeleton className="mt-2 h-8 w-20" />
      )}
    </li>
  );
}
