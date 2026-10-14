"use client";

import { useEffect } from "react";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { primaryReading } from "@/lib/official";
import { useCurrent } from "./use-current";

/** Warna langit ikut tahap IPU lokasi semasa (lalai: Baik sebelum bacaan ada). */
export function useSkyColors() {
  const { entry } = useCurrent();
  const category = primaryReading(entry?.reading)?.category ?? "baik";
  const { sky, far } = CATEGORY_STYLE[category].sky;
  return { sky, far, category };
}

/**
 * Kepala langit halaman (telefon, v0.7.1): langit awan statik ikut tahap IPU, hingga ke
 * belakang bar status, dengan tajuk dan kawalan di atasnya. Kandungan halaman di bawahnya
 * dibalut kad (`SKY_CARD`) yang bertindih sedikit, sama seperti Utama. Jalur tetap setinggi
 * bar status kekal di belakang jam semasa halaman ditatal.
 */
export function SkyHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  const { sky, far, category } = useSkyColors();
  // Jalur bar status hanya muncul bila langit sudah ditatal ke atas (tiada garis di atas langit).
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      if (window.scrollY > 8) root.dataset.scrolled = "";
      else delete root.dataset.scrolled;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      delete root.dataset.scrolled;
    };
  }, []);
  return (
    <div
      data-under-status-bar
      data-testid="sky-header"
      data-category={category}
      className="sky-header md:hidden"
      style={{ "--sky": sky, "--sky-far": far } as React.CSSProperties}
    >
      <div aria-hidden="true" className="sky-header-strip" />
      <div className="text-ink flex flex-col items-start gap-3 px-5 pt-[calc(env(safe-area-inset-top)+20px)] pb-10">
        <h1 className="font-display text-[32px] leading-none font-extrabold">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}

/** Kelas kandungan halaman: kad bersudut bulat yang bertindih dengan langit (telefon sahaja). */
export const SKY_CARD =
  "bg-page relative -mt-6 rounded-t-[28px] pt-6 md:mt-0 md:rounded-none md:bg-transparent";
