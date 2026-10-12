"use client";

import { BellRinging, Check } from "@phosphor-icons/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { IPU_CATEGORIES } from "@/lib/ipu";
import { markOnboarded } from "@/lib/onboarding";
import {
  alertLocations,
  effectiveThreshold,
  pushOptions,
  type Prefs,
} from "@/lib/prefs";
import { enablePush, pushSupport } from "@/lib/push-client";
import { useI18n } from "@/lib/use-i18n";
import { ChooseLocation } from "./choose-location";
import { IosInstallSteps } from "./install-guide";
import { Logo } from "./logo";

const STEPS = 3;
const noopSubscribe = () => () => {};

/** Julat IPU setiap kategori untuk paparan (0–50, 51–100, …, > 300). */
const RANGES = IPU_CATEGORIES.map((c, i) => {
  const min = i === 0 ? 0 : (IPU_CATEGORIES[i - 1].max ?? 0) + 1;
  return { ...c, range: c.max === null ? `> ${min - 1}` : `${min}–${c.max}` };
});

const TITLES = [
  "Apa itu IPU?",
  "Di mana anda berada?",
  "Dapatkan amaran jerebu",
];

/**
 * Pengenalan ringkas pengguna baharu (3 skrin): apa itu IPU, pilih lokasi, amaran / pasang.
 * Boleh dilangkau; dipaparkan sekali sahaja (lihat lib/onboarding).
 */
export function Onboarding({
  prefs,
  step,
  onStep,
  onDone,
}: {
  prefs: Prefs;
  step: number;
  onStep: (step: number) => void;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  // Fokus ke tajuk skrin baharu supaya pembaca skrin mengumumkannya (bukan semasa mula dibuka).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus();
  }, [step]);

  const finish = () => {
    markOnboarded();
    onDone();
  };

  return (
    <div
      data-testid="onboarding"
      className="mx-auto flex min-h-[calc(100svh-120px)] max-w-md flex-col gap-6 px-5 pt-13 pb-6 md:pt-16"
    >
      <div className="flex items-center justify-between">
        <Logo size={48} />
        <button
          type="button"
          onClick={finish}
          className="text-muted hover:text-ink min-h-11 px-2 text-sm font-semibold underline"
        >
          {t("Langkau")}
        </button>
      </div>

      <div>
        <p className="text-muted text-xs font-bold tracking-wide">
          {t("LANGKAH {n} DARIPADA {total}", { n: step + 1, total: STEPS })}
        </p>
        <h1
          ref={heading}
          tabIndex={-1}
          className="font-display mt-1 text-[30px] leading-tight font-bold outline-none"
        >
          {t(TITLES[step])}
        </h1>
      </div>

      {step === 0 && (
        <>
          <p className="text-[16px] leading-relaxed">
            {t(
              "Indeks Pencemar Udara (IPU) mengukur kebersihan udara. Semakin tinggi nombornya, semakin teruk jerebu.",
            )}
          </p>
          <ul className="flex flex-col gap-2">
            {RANGES.map((c) => (
              <li
                key={c.key}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-[15px] font-bold ${CATEGORY_STYLE[c.key].tint}`}
              >
                <span>{t(c.label)}</span>
                <span className="tabular-nums">{c.range}</span>
              </li>
            ))}
          </ul>
          <p className="text-muted text-sm">
            {t("Sumber rasmi: APIMS, Jabatan Alam Sekitar.")}
          </p>
        </>
      )}

      {step === 1 && (
        <>
          <p className="text-[16px] leading-relaxed">
            {t(
              "Pilih lokasi untuk melihat IPU dan nasihat kesihatan untuk kawasan anda.",
            )}
          </p>
          {prefs.current ? (
            <p
              role="status"
              className="bg-surface flex items-center gap-2 rounded-2xl px-4 py-3 font-semibold"
            >
              <Check aria-hidden="true" size={20} weight="bold" />
              {t("Lokasi dipilih: {name}", { name: t(prefs.current.name) })}
            </p>
          ) : (
            <ChooseLocation onChosen={() => onStep(2)} />
          )}
        </>
      )}

      {step === 2 && <AlertStep prefs={prefs} />}

      <div className="mt-auto flex flex-col gap-4">
        <div className="flex justify-center gap-2" aria-hidden="true">
          {Array.from({ length: STEPS }, (_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all motion-reduce:transition-none ${i === step ? "bg-ink w-6" : "bg-line w-2"}`}
            />
          ))}
        </div>
        <div className="flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => onStep(step - 1)}
              className="bg-surface min-h-13 flex-1 rounded-2xl font-semibold"
            >
              {t("Kembali")}
            </button>
          )}
          {step < STEPS - 1 ? (
            <button
              type="button"
              onClick={() => onStep(step + 1)}
              disabled={step === 1 && !prefs.current}
              className="bg-ink text-page min-h-13 flex-[2] rounded-2xl font-semibold disabled:opacity-40"
            >
              {t("Seterusnya")}
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="bg-ink text-page min-h-13 flex-[2] rounded-2xl font-semibold"
            >
              {t("Mula guna Hezy")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Skrin 3: hidupkan amaran (jika disokong) atau cara memasang Hezy di iPhone. */
function AlertStep({ prefs }: { prefs: Prefs }) {
  const { t } = useI18n();
  const support = useSyncExternalStore(noopSubscribe, pushSupport, () => null);
  const [state, setState] = useState<"idle" | "busy" | "on" | "denied">("idle");

  async function enable() {
    setState("busy");
    try {
      const result = await enablePush(
        alertLocations(prefs),
        effectiveThreshold(prefs),
        prefs.lang,
        pushOptions(prefs),
      );
      setState(result === "enabled" ? "on" : "denied");
    } catch {
      setState("denied");
    }
  }

  return (
    <>
      <p className="text-[16px] leading-relaxed">
        {t(
          "Hezy boleh memberitahu anda bila IPU di lokasi anda melepasi tahap tidak sihat, dan ringkasan setiap pagi.",
        )}
      </p>
      {support === "supported" && prefs.current && (
        <>
          <button
            type="button"
            onClick={enable}
            disabled={state === "busy" || state === "on"}
            className="bg-surface flex min-h-13 items-center justify-center gap-2 rounded-2xl px-5 font-semibold disabled:opacity-70"
          >
            {state === "on" ? (
              <Check aria-hidden="true" size={20} weight="bold" />
            ) : (
              <BellRinging aria-hidden="true" size={20} weight="duotone" />
            )}
            {state === "on" ? t("Amaran dihidupkan") : t("Hidupkan amaran")}
          </button>
          {state === "denied" && (
            <p role="alert" className="text-muted text-sm">
              {t(
                "Kebenaran notifikasi ditolak. Benarkan notifikasi untuk Hezy dalam tetapan pelayar.",
              )}
            </p>
          )}
        </>
      )}
      {support === "ios-install" && (
        <div className="bg-surface rounded-2xl p-4">
          <p className="text-[15px] font-bold">
            {t("Di iPhone, pasang Hezy di skrin utama dahulu:")}
          </p>
          <IosInstallSteps id="onboarding-ios-steps" />
        </div>
      )}
      <p className="text-muted text-sm">
        {t("Anda boleh menukar amaran bila-bila masa di Tetapan.")}
      </p>
    </>
  );
}
