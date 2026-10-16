"use client";

import {
  EnvelopeSimple,
  Scales,
  ShareNetwork,
  ShieldCheck,
  Sparkle,
  Trash,
  WarningCircle,
  type Icon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CHANGELOG } from "@/lib/changelog";
import { formatLongDate } from "@/lib/format";
import { useI18n } from "@/lib/use-i18n";
import { APP_VERSION } from "@/lib/version";
import { DEFAULT_PREFS, updatePrefs } from "@/lib/prefs";
import { disablePush, pushSupport } from "@/lib/push-client";
import { BottomSheet, useSheetDismiss } from "./bottom-sheet";
import { Chevron } from "./chevron";
import { LegalSheetView } from "./legal-sheets";
import { Logo } from "./logo";

const SITE_URL = "https://hezy.my";
/** Bilangan keluaran dalam "Apa yang baharu" (v0.7.14: 3 terkini sahaja). */
const WHATS_NEW_COUNT = 3;
const FEEDBACK_EMAIL = "oyendevlab@gmail.com";

function Row({
  icon: I,
  tone,
  children,
  trailing,
}: {
  icon: Icon;
  tone: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`flex size-9 shrink-0 items-center justify-center rounded-[11px] ${tone}`}
      >
        <I size={19} weight="bold" />
      </span>
      <span className="min-w-0 flex-1 text-[15px] font-bold">{children}</span>
      {trailing}
      <Chevron />
    </>
  );
}

const ROW = "flex min-h-14 w-full items-center gap-3 py-2 text-left";

/** Kad "Tentang Hezy" di bawah Tetapan (v0.7.9): logo, versi, apa yang baharu, kongsi, maklum balas, privasi. */
export function AboutHezy() {
  const { t, lang } = useI18n();
  const [whatsNew, setWhatsNew] = useState(false);
  const [disclaimer, setDisclaimer] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function share() {
    const text = t("Semak jerebu di kawasan anda dengan Hezy");
    setStatus(null);
    try {
      if (navigator.share) {
        await navigator.share({ title: "Hezy", text, url: SITE_URL });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${SITE_URL}`);
      setStatus(t("Pautan disalin"));
    } catch (error) {
      // Pengguna membatalkan helaian kongsi: tiada mesej.
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus(t("Tidak dapat berkongsi. Salin pautan: hezy.my"));
    }
  }

  const subject = encodeURIComponent(
    t("Maklum balas Hezy {version}", { version: APP_VERSION }),
  );
  const body = encodeURIComponent(
    `\n\n---\n${t("Versi")}: ${APP_VERSION}\n${t("Peranti")}: `,
  );

  return (
    <section
      aria-labelledby="tentang-hezy"
      className="bg-surface rounded-3xl px-4 pt-5 pb-1.5"
    >
      <div className="flex flex-col items-center gap-1.5 pb-4 text-center">
        <Logo size={72} />
        <h2
          id="tentang-hezy"
          className="font-display mt-1 text-[26px] leading-none font-extrabold"
        >
          Hezy
        </h2>
        <p className="text-muted text-[13px] font-semibold">
          {t("Semak Jerebu di Malaysia")}
        </p>
        <p className="text-muted text-xs">
          {t("Versi {version}", { version: APP_VERSION })}
        </p>
      </div>
      <div className="divide-line border-line divide-y border-t">
        <button
          type="button"
          onClick={() => setWhatsNew(true)}
          aria-haspopup="dialog"
          className={ROW}
        >
          <Row
            icon={Sparkle}
            tone="bg-[#fbebb8] text-[#6b4f00]"
            trailing={
              <span className="bg-ink text-page rounded-full px-2 py-0.5 text-[11px] font-extrabold">
                {APP_VERSION}
              </span>
            }
          >
            {t("Apa yang baharu")}
          </Row>
        </button>
        <button type="button" onClick={() => void share()} className={ROW}>
          <Row icon={ShareNetwork} tone="bg-[#e3eefb] text-[#1f5fa8]">
            {t("Kongsi Hezy")}
          </Row>
        </button>
        <a
          href={`mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`}
          className={ROW}
        >
          <Row icon={EnvelopeSimple} tone="bg-[#e6e2f5] text-[#4b3fa0]">
            {t("Hantar maklum balas")}
          </Row>
        </a>
        <button
          type="button"
          onClick={() => setDisclaimer(true)}
          aria-haspopup="dialog"
          className={ROW}
        >
          <Row icon={Scales} tone="bg-[#fbe3d6] text-[#8a3a12]">
            {t("Penafian")}
          </Row>
        </button>
        <Link href="/privasi" transitionTypes={["nav-forward"]} className={ROW}>
          <Row icon={ShieldCheck} tone="bg-[#dff0d4] text-[#2f6b1f]">
            {t("Privasi dan data anda")}
          </Row>
        </Link>
        <div className="flex min-h-14 w-full items-center gap-3 py-2">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-[#fbe0dd] text-[#a3261f]"
          >
            <Trash size={19} weight="bold" />
          </span>
          <span className="text-ipu-berbahaya-ink dark:text-ipu-berbahaya-tint min-w-0 flex-1 text-[15px] font-bold">
            {t("Padam data di peranti ini")}
          </span>
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            aria-haspopup="dialog"
            aria-label={t("Padam data di peranti ini")}
            className="min-h-9 shrink-0 rounded-full bg-[#fbe0dd] px-3.5 text-[13px] font-bold text-[#a3261f]"
          >
            {t("Padam")}
          </button>
        </div>
      </div>
      <p
        role="status"
        className="text-muted pb-2 text-center text-xs empty:hidden"
      >
        {status ?? ""}
      </p>

      {confirmClear && (
        <BottomSheet
          title={t("Padam data?")}
          testId="clear-sheet"
          onClose={() => setConfirmClear(false)}
          bare
        >
          <ClearDataConfirm />
        </BottomSheet>
      )}
      {disclaimer && (
        <LegalSheetView sheet="penafian" onClose={() => setDisclaimer(false)} />
      )}
      {whatsNew && (
        <BottomSheet
          title={t("Apa yang baharu")}
          testId="whats-new"
          onClose={() => setWhatsNew(false)}
        >
          <ol className="flex flex-col gap-4">
            {CHANGELOG.slice(0, WHATS_NEW_COUNT).map((r) => (
              <li key={r.version} className="flex flex-col gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="bg-ink text-page rounded-full px-2 py-0.5 text-xs font-extrabold">
                    {r.version}
                  </span>
                  <span className="text-[15px] font-bold">{t(r.title)}</span>
                  <span className="text-muted ml-auto text-xs whitespace-nowrap">
                    {formatLongDate(r.date, lang).date}
                  </span>
                </div>
                <ul className="flex flex-col gap-1.5 pl-1 text-[13px]">
                  {r.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#e8952f]"
                      />
                      {t(item)}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </BottomSheet>
      )}
    </section>
  );
}

/** Kredit pembangun (v0.7.9; dihalusi v0.7.10): kecil dan tenang di bawah kad Tentang. */
export function DeveloperCredit() {
  const { t } = useI18n();
  return (
    <section
      aria-label={t("Pembangun")}
      className="flex items-center justify-center gap-3 py-1"
    >
      <Image
        src="/kredit/syafiq.png"
        alt="Syafiq"
        width={44}
        height={44}
        className="size-11 rounded-full object-cover ring-2 ring-[#e8952f]/60 ring-offset-2 ring-offset-[var(--page)] [image-rendering:pixelated]"
      />
      <div className="flex flex-col leading-tight">
        <span className="text-muted text-[11px]">
          {t("Dibangunkan oleh")}{" "}
          <span className="text-ink font-bold">Syafiq</span>
        </span>
        <span className="text-muted font-mono text-[11px]">
          Learn. Build. Repeat
        </span>
      </div>
    </section>
  );
}

/** Pengesahan padam data (v0.7.13): ikon amaran, penerangan, Batal / Padam. */
function ClearDataConfirm() {
  const { t } = useI18n();
  const dismiss = useSheetDismiss();
  function clearData() {
    // Amaran push juga dimatikan supaya langganan dipadam daripada pelayan.
    if (pushSupport() === "supported")
      void disablePush().catch(() => undefined);
    try {
      Object.keys(window.localStorage)
        .filter((key) => key.startsWith("hezy:"))
        .forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // Storan tidak tersedia.
    }
    updatePrefs(() => DEFAULT_PREFS);
    dismiss();
  }
  return (
    <div className="flex flex-col items-center gap-3 pt-2 text-center">
      <span
        aria-hidden="true"
        className="flex size-16 items-center justify-center rounded-full bg-[#fbe0dd] text-[#a3261f]"
      >
        <WarningCircle size={34} weight="duotone" />
      </span>
      <p className="font-display text-xl font-bold">{t("Padam data?")}</p>
      <p className="text-muted text-sm leading-relaxed">
        {t(
          "Lokasi, kegemaran dan tetapan di peranti ini akan dipadam. Amaran juga dimatikan.",
        )}
      </p>
      <div className="mt-1 grid w-full grid-cols-2 gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="bg-surface min-h-12 rounded-2xl font-bold"
        >
          {t("Batal")}
        </button>
        <button
          type="button"
          onClick={clearData}
          className="min-h-12 rounded-2xl bg-[#b42323] font-bold text-white"
        >
          {t("Padam")}
        </button>
      </div>
    </div>
  );
}
