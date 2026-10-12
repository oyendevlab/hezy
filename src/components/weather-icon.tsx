"use client";

import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSun,
  Moon,
  Sun,
  type Icon,
} from "@phosphor-icons/react";
import { useI18n } from "@/lib/use-i18n";
import {
  WEATHER_LABEL,
  isWet,
  weatherKind,
  type CurrentWeather,
} from "@/lib/weather";

type Look = { icon: Icon; color: string; label: string };

/** Ikon dan label cuaca. Jerebu (IPU > 100, tidak hujan) diutamakan berbanding "Cerah". */
export function weatherLook(
  code: number,
  isDay: boolean,
  hazy = false,
  precipitation = 0,
): Look {
  const kind = weatherKind(code);
  if (hazy && !isWet(code, precipitation))
    return { icon: CloudFog, color: "#b08a2e", label: "Berjerebu" };
  switch (kind) {
    case "ribut":
      return {
        icon: CloudLightning,
        color: "#5b6ee1",
        label: WEATHER_LABEL.ribut,
      };
    case "hujan":
    case "gerimis":
      return { icon: CloudRain, color: "#3a7bd5", label: WEATHER_LABEL[kind] };
    case "kabus":
      return { icon: CloudFog, color: "#8a857c", label: WEATHER_LABEL.kabus };
    case "mendung":
      return { icon: Cloud, color: "#8a857c", label: WEATHER_LABEL.mendung };
    case "separa":
      return isDay
        ? { icon: CloudSun, color: "#e0a800", label: WEATHER_LABEL.separa }
        : { icon: CloudMoon, color: "#6b7bb5", label: WEATHER_LABEL.separa };
    default:
      return isDay
        ? { icon: Sun, color: "#e0a800", label: WEATHER_LABEL.cerah }
        : { icon: Moon, color: "#6b7bb5", label: WEATHER_LABEL.cerah };
  }
}

/** Cuaca semasa: ikon, suhu dan keadaan (di sebelah kanan bacaan IPU). */
export function WeatherNow({
  weather,
  hazy,
  size = "phone",
}: {
  weather: CurrentWeather;
  hazy: boolean;
  size?: "phone" | "desktop";
}) {
  const { t } = useI18n();
  const look = weatherLook(
    weather.code,
    weather.isDay,
    hazy,
    weather.precipitation,
  );
  const Icon = look.icon;
  return (
    <div
      className="flex shrink-0 flex-col items-end text-right"
      aria-label={t("Cuaca: {temp}°, {label}", {
        temp: weather.temperature,
        label: t(look.label),
      })}
      role="img"
    >
      <Icon
        aria-hidden="true"
        size={size === "desktop" ? 48 : 40}
        weight="duotone"
        color={look.color}
      />
      <span
        className={`font-display leading-none font-bold ${size === "desktop" ? "text-[34px]" : "text-[28px]"}`}
      >
        {weather.temperature}°
      </span>
      <span className="text-muted text-xs font-semibold">{t(look.label)}</span>
    </div>
  );
}
