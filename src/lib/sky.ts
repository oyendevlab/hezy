/**
 * Parameter langit hidup (item A) daripada IPU, cuaca, angin dan masa.
 * Fungsi tulen: digunakan oleh shader WebGL dan latar sandaran CSS.
 */

import type { CurrentWeather } from "./weather";
import { isWet, weatherKind } from "./weather";

export type SkyParams = {
  /** 0 (jernih) – 1 (jerebu teruk). */
  haze: number;
  /** 0 – 1 */
  cloud: number;
  /** 0 – 1 */
  rain: number;
  /** Ketinggian matahari: 1 = tengah hari, 0 = ufuk, < 0 = malam. */
  sunEl: number;
  /** Kedudukan mendatar matahari 0–1 (timur → barat). */
  sunX: number;
  /** Fasa bulan 0–1 (0 = anak bulan, 0.5 = purnama). */
  moonPhase: number;
  /** Arah angin DATANG sebagai vektor (x = timur, y = utara). */
  windX: number;
  windY: number;
  /** km/j */
  windSpeed: number;
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

/** Minit sejak tengah malam bagi `YYYY-MM-DDTHH:mm`. */
const minutesOf = (time: string) =>
  Number(time.slice(11, 13)) * 60 + Number(time.slice(14, 16));

/** Minit semasa waktu Malaysia (UTC+8). */
export function malaysiaMinutes(now: Date): number {
  const m = (now.getUTCHours() * 60 + now.getUTCMinutes() + 8 * 60) % 1440;
  return m + now.getUTCSeconds() / 60;
}

/** Fasa bulan 0–1 daripada tarikh (bulan sinodik 29.53 hari). */
export function moonPhase(now: Date): number {
  const synodic = 29.530588853;
  const reference = Date.UTC(2000, 0, 6, 18, 14); // anak bulan
  const days = (now.getTime() - reference) / 86_400_000;
  return (((days % synodic) + synodic) % synodic) / synodic;
}

/** Ketinggian dan kedudukan matahari daripada waktu terbit/terbenam (lalai Malaysia ~7:00/19:10). */
export function sunPosition(
  minutes: number,
  sunrise: string | null,
  sunset: string | null,
): { sunEl: number; sunX: number } {
  const rise = sunrise ? minutesOf(sunrise) : 7 * 60;
  const set = sunset ? minutesOf(sunset) : 19 * 60 + 10;
  const f = (minutes - rise) / (set - rise);
  const sunEl =
    f >= 0 && f <= 1
      ? Math.sin(Math.PI * f)
      : -Math.min(Math.abs(f < 0 ? f : f - 1) * 3, 1);
  return { sunEl, sunX: 0.12 + 0.76 * Math.min(Math.max(f, 0), 1) };
}

export function skyParams(input: {
  ipu: number | null;
  weather: CurrentWeather | null | undefined;
  wind: { direction: number; speed: number } | null | undefined;
  now: Date;
}): SkyParams {
  const { ipu, weather, wind, now } = input;
  const wet = weather ? isWet(weather.code, weather.precipitation) : false;
  const ipuHaze = ipu === null ? 0 : smooth(45, 260, ipu);
  // Jarak penglihatan rendah semasa hujan bukan jerebu.
  const visHaze =
    weather?.visibilityKm != null && !wet
      ? 1 - smooth(1.5, 12, weather.visibilityKm)
      : 0;
  const kind = weather ? weatherKind(weather.code) : "cerah";
  const rain =
    kind === "ribut"
      ? 1
      : kind === "hujan"
        ? 0.75
        : kind === "gerimis"
          ? 0.35
          : 0;
  const { sunEl, sunX } = sunPosition(
    malaysiaMinutes(now),
    weather?.sunrise ?? null,
    weather?.sunset ?? null,
  );
  const rad = ((wind?.direction ?? 225) * Math.PI) / 180;
  return {
    haze: Math.max(ipuHaze, visHaze),
    cloud: Math.min(Math.max((weather?.cloud ?? 30) / 100, 0), 1),
    rain,
    sunEl,
    sunX,
    moonPhase: moonPhase(now),
    windX: Math.sin(rad),
    windY: Math.cos(rad),
    windSpeed: wind?.speed ?? 8,
  };
}

/** Warna atas dan bawah langit untuk latar sandaran (sebelum WebGL siap atau tanpa WebGL). */
export function fallbackGradient(p: SkyParams): [string, string] {
  const day = smooth(-0.1, 0.12, p.sunEl);
  const mix = (a: number[], b: number[], t: number) =>
    a.map((v, i) => v + (b[i] - v) * t);
  const hz = mix([0.17, 0.15, 0.13], [0.8, 0.74, 0.58], day);
  let top = mix([0.02, 0.035, 0.1], [0.2, 0.47, 0.86], day);
  let bottom = mix([0.07, 0.1, 0.22], [0.7, 0.85, 0.96], day);
  top = mix(top, hz, p.haze * 0.6);
  bottom = mix(bottom, hz, Math.min(p.haze * 1.05, 0.97));
  const css = (c: number[]) =>
    `rgb(${c.map((v) => Math.round(v * 255)).join(" ")})`;
  return [css(top), css(bottom)];
}
