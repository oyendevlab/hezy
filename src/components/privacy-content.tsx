"use client";

import Link from "next/link";
import { useI18n } from "@/lib/use-i18n";

/** Kemas kini terakhir dasar privasi. */
const UPDATED = "12 Okt 2026";

const SECTIONS: { title: string; points: string[] }[] = [
  {
    title: "Ringkasnya",
    points: [
      "Hezy tidak memerlukan akaun dan tidak menggunakan kuki pengiklanan.",
      "Kami tidak menjual atau berkongsi data anda untuk pengiklanan.",
    ],
  },
  {
    title: "Lokasi dan tetapan",
    points: [
      "Lokasi semasa, kegemaran, profil kesihatan, tema dan bahasa disimpan dalam peranti anda sahaja (storan pelayar).",
      "Untuk mengambil bacaan, koordinat dihantar ke pelayan Hezy selepas dibundarkan kepada kira-kira 1 km, dan tidak disimpan.",
      "GPS hanya digunakan bila anda menekan “Guna lokasi saya”.",
    ],
  },
  {
    title: "Amaran notifikasi",
    points: [
      "Bila anda menghidupkan amaran, pelayan menyimpan langganan notifikasi pelayar anda, lokasi amaran (dibundarkan kira-kira 1 km) dan namanya, ambang, bahasa serta pilihan rutin amaran.",
      "Data ini disimpan dalam Vercel Blob (Singapura) sehingga anda mematikan amaran atau langganan tamat, kemudian dipadam.",
    ],
  },
  {
    title: "Log ralat",
    points: [
      "Bila aplikasi mengalami ralat, Hezy merekod mesej ralat, halaman, versi aplikasi dan jenis pelayar untuk membaikinya.",
      "Tiada alamat IP, lokasi atau maklumat peribadi direkod. Log dipadam selepas 14 hari.",
    ],
  },
  {
    title: "Statistik penggunaan",
    points: [
      "Hezy menggunakan Vercel Web Analytics tanpa kuki untuk mengira paparan halaman, jenis peranti dan negara secara keseluruhan. Pengguna individu tidak dikenal pasti.",
    ],
  },
  {
    title: "Pihak ketiga",
    points: [
      "Bacaan IPU daripada APIMS (Jabatan Alam Sekitar), cuaca dan anggaran daripada Open-Meteo, dan titik panas daripada NASA FIRMS diambil oleh pelayan Hezy; maklumat peranti anda tidak dihantar kepada mereka.",
      "Jubin peta (OpenStreetMap) dan sensor tambahan (WAQI) dimuat terus oleh pelayar anda bila anda membuka Peta, jadi mereka boleh melihat alamat IP anda seperti mana-mana laman web.",
    ],
  },
  {
    title: "Memadam data anda",
    points: [
      "Tetapan → “Padam data di peranti ini” memadam semua data Hezy dalam peranti dan mematikan amaran (langganan dipadam daripada pelayan).",
      "Mematikan amaran sahaja juga memadam langganan daripada pelayan.",
    ],
  },
];

export function PrivacyContent() {
  const { t } = useI18n();
  return (
    <article className="mx-auto flex max-w-[720px] flex-col gap-6 px-5 pt-13 pb-10 md:px-10 md:pt-10">
      <nav
        aria-label={t("Laluan")}
        className="text-muted text-sm font-semibold"
      >
        <Link href="/tetapan" className="underline">
          {t("Tetapan")}
        </Link>{" "}
        / {t("Privasi")}
      </nav>
      <header>
        <h1 className="font-display text-[32px] leading-tight font-bold">
          {t("Privasi dan data anda")}
        </h1>
        <p className="text-muted mt-1 text-sm">
          {t("Dikemas kini {date}", { date: UPDATED })}
        </p>
      </header>
      {SECTIONS.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="font-display text-xl font-bold">{t(section.title)}</h2>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed">
            {section.points.map((point) => (
              <li key={point}>{t(point)}</li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-muted text-sm">
        {t("Soalan atau permintaan berkaitan data:")}{" "}
        <a
          href="https://github.com/oyendevlab/hezy/issues"
          className="underline"
        >
          github.com/oyendevlab/hezy/issues
        </a>
      </p>
    </article>
  );
}
