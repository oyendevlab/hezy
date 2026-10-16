"use client";

import {
  Bell,
  ChartBar,
  Clock,
  FirstAid,
  Info,
  MapPin,
  Student,
  UserCircleMinus,
  Warning,
  type Icon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useI18n } from "@/lib/use-i18n";
import { BottomSheet } from "./bottom-sheet";

export type LegalSheet = "privasi" | "penafian";

/** Penafian Hezy (v0.7.12): ringkas dan berikon. Teks BM ialah kunci `t()`. */
export const DISCLAIMER: readonly { icon: Icon; text: string }[] = [
  {
    icon: Info,
    text: "Hezy bukan aplikasi rasmi Jabatan Alam Sekitar (JAS) atau kerajaan. IPU rasmi datang daripada APIMS (JAS).",
  },
  {
    icon: Clock,
    text: "Data boleh lewat atau tiada. Anggaran dan ramalan mungkin berbeza daripada bacaan sebenar.",
  },
  {
    icon: FirstAid,
    text: "Nasihat kesihatan adalah umum, bukan nasihat perubatan. Dapatkan rawatan jika anda bergejala.",
  },
  {
    icon: Student,
    text: "Status sekolah hanya panduan. Keputusan rasmi dibuat oleh sekolah, PPD atau JPN.",
  },
  {
    icon: Warning,
    text: "Gunakan atas budi bicara sendiri. Hezy tidak bertanggungjawab atas keputusan yang dibuat berdasarkan aplikasi ini.",
  },
];

/** Ringkasan privasi untuk helaian (dasar penuh di /privasi). */
const PRIVACY: readonly { icon: Icon; text: string }[] = [
  {
    icon: UserCircleMinus,
    text: "Tiada akaun dan tiada kuki pengiklanan.",
  },
  {
    icon: MapPin,
    text: "Lokasi dan tetapan disimpan dalam peranti anda. Untuk bacaan, koordinat dibundarkan ~1 km dan tidak disimpan.",
  },
  {
    icon: Bell,
    text: "Bila amaran dihidupkan, langganan notifikasi disimpan sehingga anda mematikannya.",
  },
  {
    icon: ChartBar,
    text: "Statistik penggunaan tanpa kuki; pengguna individu tidak dikenal pasti.",
  },
];

function Rows({ rows }: { rows: readonly { icon: Icon; text: string }[] }) {
  const { t } = useI18n();
  return (
    <ul className="flex flex-col gap-3">
      {rows.map(({ icon: RowIcon, text }) => (
        <li key={text} className="flex items-start gap-3 text-sm leading-snug">
          <RowIcon
            aria-hidden="true"
            size={20}
            weight="duotone"
            className="mt-px shrink-0"
          />
          {t(text)}
        </li>
      ))}
    </ul>
  );
}

/** Helaian Privasi atau Penafian (skrin alu-aluan dan Tetapan). */
export function LegalSheetView({
  sheet,
  onClose,
}: {
  sheet: LegalSheet;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return sheet === "privasi" ? (
    <BottomSheet title={t("Privasi")} testId="privacy-sheet" onClose={onClose}>
      <Rows rows={PRIVACY} />
      <Link
        href="/privasi"
        transitionTypes={["nav-forward"]}
        className="text-sm font-bold underline"
      >
        {t("Baca dasar privasi penuh")}
      </Link>
    </BottomSheet>
  ) : (
    <BottomSheet
      title={t("Penafian")}
      testId="disclaimer-sheet"
      onClose={onClose}
    >
      <Rows rows={DISCLAIMER} />
    </BottomSheet>
  );
}
