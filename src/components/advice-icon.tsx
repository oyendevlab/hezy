"use client";

import {
  Baby,
  Basketball,
  Door,
  Drop,
  Fan,
  FaceMask,
  FirstAid,
  Heartbeat,
  House,
  Megaphone,
  PersonSimpleRun,
  PersonSimpleWalk,
  Pill,
  Prohibit,
  ShieldCheck,
  Stethoscope,
  Tree,
  Wind,
  type Icon,
} from "@phosphor-icons/react";

/** Ikon bagi setiap tip nasihat (teks BM dalam src/lib/advice.ts). */
const TIP_ICON: Record<string, Icon> = {
  "Sesuai untuk bersenam di luar": PersonSimpleRun,
  "Buka tingkap untuk pengudaraan": Wind,
  "Tiada sekatan aktiviti luar": Tree,
  "Kekalkan gaya hidup sihat": Heartbeat,
  "Bawa inhaler bila keluar": Pill,
  "Pantau anak jika batuk atau sesak nafas": Baby,
  "Pakai topeng N95 jika perlu keluar": FaceMask,
  "Tutup tingkap dan pintu": Door,
  "Minum air secukupnya": Drop,
  "Hadkan aktiviti luar dan sukan di sekolah": Basketball,
  "Hadkan aktiviti luar dan sentiasa bawa inhaler": Pill,
  "Tangguhkan jalan pagi dan aktiviti di luar": PersonSimpleWalk,
  "Tutup tingkap, guna penapis udara jika ada": Fan,
  "Elak aktiviti luar": House,
  "Anak perlu kekal di dalam rumah": Baby,
  "Jumpa doktor jika simptom bertambah teruk": Stethoscope,
  "Kekal di dalam dan jumpa doktor jika tidak sihat": Stethoscope,
  "Elak semua aktiviti luar": Prohibit,
  "Ikuti pengumuman rasmi di media": Megaphone,
  "Anak tidak boleh beraktiviti di luar": Baby,
  "Dapatkan rawatan segera jika sesak nafas": FirstAid,
  "Dilarang beraktiviti di luar": Prohibit,
};

export function AdviceIcon({
  tip,
  color,
  size = 22,
}: {
  tip: string;
  color: string;
  size?: number;
}) {
  const Icon = TIP_ICON[tip] ?? ShieldCheck;
  return (
    <Icon
      aria-hidden="true"
      size={size}
      weight="duotone"
      color={color}
      className="shrink-0"
    />
  );
}

/** Untuk ujian: semua tip mempunyai ikon. */
export const ADVICE_TIPS_WITH_ICON = Object.keys(TIP_ICON);
