"use client";

import { CATEGORY_STYLE } from "@/lib/category-style";
import { primaryReading } from "@/lib/official";
import { useCurrent } from "./use-current";

/** Langit lalai sebelum bacaan ada (sama seperti tahap Baik). */
const DEFAULT_SKY = CATEGORY_STYLE.baik.sky.sky;

/**
 * Jalur langit pendek di atas halaman selain Utama (telefon), warna ikut tahap IPU lokasi
 * semasa (v0.7.1). Dalam mod aplikasi (bar status `black-translucent`), jalur tetap setinggi
 * bar status memastikan jam sentiasa boleh dibaca semasa halaman ditatal.
 *
 * Sentiasa dirender (susun atur akar diprarender tanpa laluan sebenar); CSS menyembunyikannya
 * bila halaman mempunyai langit sendiri (`[data-under-status-bar]`: Utama, skrin alu-aluan).
 */
export function PageSky() {
  const { entry } = useCurrent();
  const category = primaryReading(entry?.reading)?.category;
  const sky = category ? CATEGORY_STYLE[category].sky.sky : DEFAULT_SKY;
  return (
    <>
      <div
        aria-hidden="true"
        data-testid="page-sky"
        className="page-sky pointer-events-none absolute inset-x-0 top-0 -z-10 md:hidden"
        style={{ "--sky": sky } as React.CSSProperties}
      />
      <div
        aria-hidden="true"
        className="status-strip pointer-events-none fixed inset-x-0 top-0 z-40 md:hidden"
        style={{ background: sky }}
      />
    </>
  );
}
