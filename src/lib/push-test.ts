import type { Lang } from "./i18n";

/** Satu notifikasi ujian bagi setiap peranti seminit. */
export const TEST_COOLDOWN_MS = 60_000;
/** Had kasar setiap instans fungsi seminit (perlindungan daripada banjir). */
export const TEST_MAX_PER_MINUTE = 20;

/** Saat sebelum peranti boleh menghantar notifikasi ujian lagi (0 = dibenarkan). */
export function cooldownSeconds(last: number | undefined, now: number): number {
  if (last === undefined) return 0;
  return Math.max(0, Math.ceil((last + TEST_COOLDOWN_MS - now) / 1000));
}

const TEXT: Record<Lang, { title: string; body: string }> = {
  ms: {
    title: "Hezy: notifikasi ujian",
    body: "Amaran berfungsi. Anda akan dimaklumkan bila IPU melepasi ambang anda.",
  },
  en: {
    title: "Hezy: test notification",
    body: "Alerts are working. You'll be notified when the API passes your threshold.",
  },
};

/** Muatan push ujian (tag sendiri supaya tidak menggantikan amaran sebenar). */
export function testPayload(lang: Lang = "ms") {
  return { ...TEXT[lang], url: "/tetapan", tag: "hezy-test", lang };
}
