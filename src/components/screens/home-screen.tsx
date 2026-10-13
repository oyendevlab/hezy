"use client";

import { Info } from "@phosphor-icons/react";
import Link from "next/link";
import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { shownError } from "@/lib/accuracy";
import { HEALTH_PROFILES, adviceFor, type QuickTone } from "@/lib/advice";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { useMediaQuery } from "@/lib/use-media-query";
import { formatChange, formatClock } from "@/lib/format";
import { displayIpu, primaryReading } from "@/lib/official";
import type { Prefs, SavedLocation } from "@/lib/prefs";
import type { Reading } from "@/lib/reading";
import { buildSharePath } from "@/lib/share";
import { buildCardPath, type CardFormat } from "@/lib/share-card";
import { useI18n } from "@/lib/use-i18n";
import { useReading, type ReadingEntry } from "@/lib/use-reading";
import { IpuPill } from "../ipu-pill";
import { SchoolCard } from "../school-card";
import { PullToRefresh } from "../pull-to-refresh";
import { ReadingNotices } from "../reading-notices";
import { RefreshButton } from "../refresh-button";
import { ShareButton } from "../share-button";
import { SkyCanvas } from "../sky-canvas";
import { Notice, Skeleton } from "../status";
import { TrendPanel } from "../trend-panel";
import { useCurrent } from "../use-current";
import { WindLine } from "../wind-line";
import { AdviceIcon } from "../advice-icon";
import { WeatherNow } from "../weather-icon";
import { InstallBanner } from "../install-banner";
import { HomeHeader } from "../home-header";
import { ElasticCard } from "../elastic-card";
import { TrendLink, TrendLinkSkeleton } from "../trend-link";
import { WelcomeScreen } from "../welcome-screen";
import { IpuScaleButton, IpuScaleCoach } from "../ipu-scale";
import { AlertCard } from "../alert-card";
import type { NationalSummary } from "@/lib/national";
import { AnimatedNumber } from "../animated-number";
import { LocationMenu } from "../location-menu";

export function HomeScreen({
  national = null,
}: {
  national?: NationalSummary | null;
}) {
  const { prefs, location, entry, refresh } = useCurrent();

  // Sebelum prefs dibaca (HTML pelayan dan render pertama), rangka Utama DAN skrin alu-aluan
  // dirender; skrip dalam <head> (`data-welcome`) memilih yang kelihatan supaya pengguna
  // baharu terus nampak skrin alu-aluan tanpa menunggu JavaScript, tanpa kelipan untuk
  // pengguna lama. Kedudukan anak kekal sama supaya WelcomeScreen tidak dipasang semula.
  return (
    <>
      {prefs === null && <HomeSkeleton />}
      {prefs === null || !location ? (
        <WelcomeScreen national={national} active={prefs !== null} />
      ) : (
        <HomeView
          prefs={prefs}
          location={location}
          entry={entry}
          onRetry={refresh}
        />
      )}
    </>
  );
}

function HomeSkeleton() {
  return (
    <div aria-busy="true" data-home-skeleton>
      {/* Telefon: bentuk sama seperti Utama — langit, kad putih, ringkasan, kad trend. */}
      <div className="md:hidden">
        <div
          className="fixed inset-x-0 top-0 h-[560px]"
          style={{
            background:
              "linear-gradient(to bottom, var(--line), var(--surface))",
          }}
        />
        <div className="relative flex justify-between px-5 pt-[max(env(safe-area-inset-top),16px)]">
          <Skeleton className="h-11 w-36 rounded-full !bg-white/50" />
          <Skeleton className="size-11 rounded-full !bg-white/50" />
        </div>
        <div className="bg-page relative mt-[150px] flex min-h-[calc(100svh-210px)] flex-col gap-4 rounded-t-[28px] px-5.5 pt-6 pb-8">
          <SummarySkeleton />
          <TrendLinkSkeleton />
        </div>
      </div>
      <div className="mx-auto hidden max-w-[1200px] px-10 pt-10 md:block">
        <Skeleton className="h-[380px]" />
        <Skeleton className="mt-4 h-24" />
      </div>
    </div>
  );
}

/** Rangka tajuk: label IPU, nombor + pil, cuaca, nasihat dan baris angin. */
function HeadlineSkeleton({ size }: { size: "phone" | "desktop" }) {
  const desktop = size === "desktop";
  return (
    <div
      aria-busy="true"
      data-testid="headline-skeleton"
      className="flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-44 rounded-md" />
          <div className="flex items-center gap-3.5">
            <Skeleton
              className={desktop ? "h-[100px] w-[160px]" : "h-[76px] w-[118px]"}
            />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-md" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-full rounded-lg" />
        <Skeleton className="h-6 w-3/4 rounded-lg" />
      </div>
      <Skeleton className="h-4 w-56 rounded-md" />
    </div>
  );
}

/** Rangka ringkasan: label IPU, nombor + pil, cuaca, nasihat, baris angin, tiga petak. */
function SummarySkeleton() {
  return (
    <div
      aria-busy="true"
      data-testid="summary-skeleton"
      className="flex flex-col gap-4"
    >
      <HeadlineSkeleton size="phone" />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[72px]" />
        ))}
      </div>
    </div>
  );
}

/** Had kedudukan bahagian atas kad putih (px dari atas skrin) di telefon. */
const CARD_TOP_MIN = 124;
const CARD_TOP_MAX = 408;
/** pt-6 + pb-8 kad putih. */
const CARD_PADDING_Y = 56;
const CARD_PADDING_BOTTOM = 32;
/** Jarak antara kandungan terakhir kad dan bar navigasi pada kedudukan rehat. */
const REST_GAP = 16;

type ViewProps = {
  prefs: Prefs;
  location: SavedLocation;
  entry: ReadingEntry | undefined;
  onRetry: () => void;
};

function HomeView({ prefs, location, entry, onRetry }: ViewProps) {
  const { t, lang } = useI18n();
  const reading = entry?.reading;
  const current = primaryReading(reading);
  const showSchool = prefs.profile === "anak" || prefs.showSchool;
  // Kedudukan rehat kad putih (telefon): seluruh kandungan kelihatan di atas bar navigasi,
  // dengan ruang langit antara CARD_TOP_MIN dan CARD_TOP_MAX.
  const spacerRef = useRef<HTMLDivElement>(null);
  const cardContentRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const place = () => {
      const content = cardContentRef.current;
      const spacer = spacerRef.current;
      if (!content || !spacer) return;
      const height = content.offsetHeight + CARD_PADDING_Y;
      const nav = document.querySelector<HTMLElement>("[data-bottom-nav]");
      const navTop = nav?.getBoundingClientRect().top ?? window.innerHeight;
      // pb-8 kad sudah memberi jarak di atas bar navigasi.
      spacer.style.height = `${Math.min(
        Math.max(
          navTop - height + CARD_PADDING_BOTTOM - REST_GAP,
          CARD_TOP_MIN,
        ),
        CARD_TOP_MAX,
      )}px`;
    };
    place();
    window.addEventListener("resize", place);
    // Kandungan berubah saiz (cth. kad amaran muncul kemudian): kira semula kedudukan rehat.
    const observer = new ResizeObserver(place);
    if (cardContentRef.current) observer.observe(cardContentRef.current);
    return () => {
      window.removeEventListener("resize", place);
      observer.disconnect();
    };
  }, [reading, showSchool]);

  // Satu konteks WebGL sahaja: langit telefon atau panorama desktop.
  const wide = useMediaQuery("(min-width: 768px)");
  // Telefon: kad berhenti di dua kedudukan sahaja — rehat atau atas (CARD_TOP_MIN).
  // Kandungan lebih panjang daripada skrin masih boleh ditatal bebas di dalam kad.
  useEffect(() => {
    if (wide) return;
    const root = document.documentElement;
    root.style.scrollSnapType = "y mandatory";
    return () => {
      root.style.scrollSnapType = "";
    };
  }, [wide]);
  const sky = {
    ipu: current?.ipu ?? null,
    weather: reading?.weather,
    wind: reading?.wind,
  };
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
  const card =
    current && reading
      ? (format: CardFormat) =>
          buildCardPath({
            name: location.name,
            ipu: current.ipu,
            source: current.source,
            hours: reading.today.map(displayIpu),
            now: reading.today.findLastIndex((h) => !h.forecast),
            time: formatClock(current.time, lang),
            lang,
            format,
          })
      : undefined;
  const fileName = `hezy-${location.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

  return (
    <>
      {/* Tablet sentuh: penunjuk biasa; telefon guna kad elastik. */}
      {wide && <PullToRefresh />}
      {/* Telefon: mockup C */}
      <section className="md:hidden">
        {/* Titik snap kedudukan rehat (tatalan 0). */}
        <div aria-hidden="true" className="absolute top-0 h-0 snap-start" />
        {/* Pengepala tetap menindih langit (margin negatif = tinggi pengepala). */}
        <HomeHeader
          current={current}
          className="-mb-[76px]"
          innerClassName="px-5 pt-[max(env(safe-area-inset-top),16px)] pb-3"
          left={
            <LocationMenu
              location={location}
              className="bg-white/70 text-[#1c1a16] shadow-[0_1px_6px_rgb(0_0_0/0.12)] backdrop-blur"
            />
          }
          right={
            <ShareButton
              text={shareText}
              path={sharePath}
              card={card}
              fileName={fileName}
              className="bg-white/70 text-[#1c1a16] shadow-[0_1px_6px_rgb(0_0_0/0.12)] backdrop-blur"
            />
          }
        />
        {/* Langit tetap di belakang; hanya kad putih bergerak (dan ditarik seperti getah). */}
        {!wide && (
          <SkyCanvas
            {...sky}
            coverAt={300}
            blendTop
            className="fixed inset-x-0 top-0 h-[560px] w-full"
          />
        )}
        {/* Ruang langit: dikira supaya kandungan kad muat penuh di atas bar navigasi. */}
        <div
          ref={spacerRef}
          aria-hidden="true"
          data-testid="card-spacer"
          style={{ height: CARD_TOP_MAX }}
        />
        {/* min-h: kad hanya boleh ditolak hingga bahagian atasnya ~124 px dari atas skrin. */}
        <ElasticCard className="bg-page min-h-[calc(100svh-236px)] snap-start scroll-mt-[124px] rounded-t-[28px] px-5.5 pt-6 pb-8">
          <div ref={cardContentRef} className="flex flex-col gap-4">
            <Summary
              entry={entry}
              reading={reading}
              onRetry={onRetry}
              size="phone"
              profile={prefs.profile}
            />
            {current && showSchool && <SchoolCard reading={current} />}
            {!wide && current && <AlertCard prefs={prefs} ipu={current.ipu} />}
            <InstallBanner />
            {reading ? (
              <TrendLink hours={reading.today} />
            ) : (
              entry?.status !== "error" && <TrendLinkSkeleton />
            )}
          </div>
        </ElasticCard>
      </section>

      {/* Tablet & desktop: pilihan 2 */}
      <section className="hidden md:block">
        <HomeHeader
          current={current}
          className="-mb-[72px]"
          innerClassName="mx-auto max-w-[1200px] px-10 py-3.5"
          left={
            <LocationMenu
              location={location}
              className="bg-white/70 text-[#1c1a16] shadow-[0_1px_6px_rgb(0_0_0/0.12)] backdrop-blur"
            />
          }
          right={
            <>
              <RefreshButton className="inline-flex border-transparent bg-white/70 text-[#1c1a16] shadow-[0_1px_6px_rgb(0_0_0/0.12)] backdrop-blur hover:bg-white" />
              <ShareButton
                text={shareText}
                path={sharePath}
                card={card}
                fileName={fileName}
                className="bg-white/70 text-[#1c1a16] shadow-[0_1px_6px_rgb(0_0_0/0.12)] backdrop-blur"
              />
            </>
          }
        />
        <div className="relative h-[420px] overflow-hidden">
          {wide && (
            <SkyCanvas {...sky} className="absolute inset-0 h-full w-full" />
          )}
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
            {wide && current && <AlertCard prefs={prefs} ipu={current.ipu} />}
            <InstallBanner />
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

  if (!reading) return <SummarySkeleton />;

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
              <AdviceIcon
                tip={tip}
                color={CATEGORY_STYLE[current!.category].accent}
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
    if (entry?.status === "error") return null;
    return <HeadlineSkeleton size={size} />;
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
  const estimateError = shownError(reading.accuracy, "estimate");
  const big = size === "desktop" ? "text-[112px]" : "text-[84px]";
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            aria-hidden="true"
            className="text-muted text-xs font-bold tracking-[0.14em] uppercase"
          >
            {t("Indeks Pencemaran Udara")}
          </div>
          <div className="flex items-center gap-3.5">
            <h1
              data-ipu-headline
              aria-label={t("IPU {ipu}, {label}", {
                ipu: current.ipu,
                label: t(current.label),
              })}
              className={`font-display ${big} leading-[0.9] font-bold tracking-[-0.04em] tabular-nums`}
            >
              <AnimatedNumber value={current.ipu} />
            </h1>
            <div className="flex flex-col items-start gap-1.5">
              <IpuScaleButton
                ipu={current.ipu}
                category={current.category}
                label={t(current.label)}
              />
              <span className="text-muted flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
                <span
                  aria-hidden="true"
                  className={`size-1.5 rounded-full ${current.source === "apims" ? "bg-[#2e9e5b]" : "bg-[#8a857c]"}`}
                />
                {current.source === "apims"
                  ? t("Rasmi · APIMS")
                  : t("Anggaran model")}
              </span>
              {change && (
                <span className="text-muted text-[13px] font-semibold">
                  {change}
                </span>
              )}
              {entry?.status === "loading" && (
                <span className="text-muted text-xs">
                  {t("Mengemas kini…")}
                </span>
              )}
            </div>
          </div>
        </div>
        {reading.weather && (
          <WeatherNow
            weather={reading.weather}
            hazy={current.ipu > 100}
            size={size}
          />
        )}
      </div>
      <IpuScaleCoach label={t(current.label)} />
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
      {reading.wind && <WindLine wind={reading.wind} />}
      <SourceLine
        reading={reading}
        current={current}
        estimateError={estimateError}
      />
    </>
  );
}

/** Sumber ringkas; butiran (sumber penuh, pencemar, anggaran model, ketepatan) di sebalik ⓘ. */
function SourceLine({
  reading,
  current,
  estimateError,
}: {
  reading: Reading;
  current: NonNullable<ReturnType<typeof primaryReading>>;
  estimateError: number | null;
}) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const id = useId();
  const official = reading.official;
  const rows: [string, string][] = official
    ? [
        [t("Sumber"), t("IPU rasmi APIMS (Jabatan Alam Sekitar)")],
        [t("Stesen"), `${official.stationName} · ${official.distanceKm} km`],
        ...(official.pollutant
          ? ([[t("Pencemar utama"), official.pollutant]] as [string, string][])
          : []),
        [t("Masa bacaan"), formatClock(official.time, lang)],
        ...(reading.current
          ? ([[t("Anggaran model"), String(reading.current.ipu)]] as [
              string,
              string,
            ][])
          : []),
      ]
    : [
        [t("Sumber"), t("Anggaran daripada PM2.5 (Open-Meteo, model CAMS)")],
        [t("Stesen"), t("Tiada stesen APIMS dalam 30 km")],
        [t("Masa bacaan"), formatClock(current.time, lang)],
        ...(estimateError !== null
          ? ([
              [
                t("Ketepatan"),
                t("biasanya ±{n} berbanding bacaan rasmi", {
                  n: estimateError,
                }),
              ],
            ] as [string, string][])
          : []),
      ];
  return (
    <div className="text-muted text-xs font-medium">
      <div className="flex items-center gap-1">
        <span>
          {official
            ? t("Stesen {station} · {km} km · {time}", {
                station: official.stationName,
                km: official.distanceKm,
                time: formatClock(official.time, lang),
              })
            : t("Anggaran model · dikemas kini {time}", {
                time: formatClock(current.time, lang),
              })}
        </span>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          aria-label={t("Butiran sumber bacaan")}
          onClick={() => setOpen((o) => !o)}
          className="hover:bg-surface text-muted -my-2 flex size-9 items-center justify-center rounded-full"
        >
          <Info
            aria-hidden="true"
            size={16}
            weight={open ? "fill" : "regular"}
          />
        </button>
      </div>
      {open && (
        <dl
          id={id}
          className="bg-surface mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-xl px-3 py-2.5"
        >
          {rows.map(([k, v]) => (
            <Fragment key={k}>
              <dt className="font-semibold">{k}</dt>
              <dd className="text-ink">{v}</dd>
            </Fragment>
          ))}
        </dl>
      )}
    </div>
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
              className={`flex size-8 shrink-0 items-center justify-center rounded-full ${CATEGORY_STYLE[category].tint}`}
            >
              <AdviceIcon tip={tip} color="currentColor" size={18} />
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
