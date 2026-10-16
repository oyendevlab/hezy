import { OG_FONT_FAMILY, ogFonts } from "@/lib/og-fonts";
import { LOGO_DATA_URL } from "@/lib/logo-art";
import { ImageResponse } from "next/og";
import { adviceFor } from "@/lib/advice";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { getStations } from "@/lib/data";
import { flagDataUrl } from "@/lib/flag-image";
import { formatHour, formatShortDate } from "@/lib/format";
import { translate } from "@/lib/i18n";
import { ipuCategory } from "@/lib/ipu";
import { CARD_SIZE } from "@/lib/share-card";
import { parseStateCard, summarizeState } from "@/lib/state-card";

const INK = "#1c1a16";
const MUTED = "#5a564e";

/**
 * GET /kongsi/negeri?g=selangor&l=ms&f=square|story
 * Imej kad IPU negeri (v0.7.0 item 11): bendera, IPU tertinggi, stesen melebihi 100 dan
 * senarai stesen teratas. Data terus daripada APIMS (bukan parameter), jadi tidak boleh dipalsukan.
 */
export async function GET(request: Request) {
  const card = parseStateCard(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!card) return new Response("Negeri tidak sah.", { status: 400 });
  const { state, lang, format } = card;
  const t = (text: string, vars?: Record<string, string | number>) =>
    translate(lang, text, vars);
  const story = format === "story";
  const [summary, flag] = await Promise.all([
    getStations()
      .then((s) => summarizeState(s, state))
      .catch(() => null),
    flagDataUrl(state.id, request.url),
  ]);
  const top = summary?.stations[0] ?? null;
  const category = top ? ipuCategory(top.ipu) : null;
  const style = CATEGORY_STYLE[category?.key ?? "sederhana"];
  const darkPill = category?.key === "baik" || category?.key === "sederhana";
  const rows = summary?.stations.slice(0, story ? 8 : 5) ?? [];
  const when = summary?.time
    ? `${formatHour(summary.time, lang)} · ${formatShortDate(summary.time.slice(0, 10), lang)}`
    : null;

  const fonts = await ogFonts(request.url);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: story ? "120px 64px 96px" : "60px 68px",
        background: style.sky.sky,
        color: INK,
        fontFamily: `${OG_FONT_FAMILY}, sans-serif`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- imej next/og */}
          <img src={LOGO_DATA_URL} width={60} height={60} alt="" />
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800 }}>
            Hezy
          </div>
        </div>
        {when && (
          <div style={{ display: "flex", fontSize: 28, fontWeight: 600 }}>
            {when}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: story ? 34 : 26,
          background: "#fff",
          borderRadius: 48,
          padding: story ? "52px 48px" : "42px 48px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 40,
            fontWeight: 700,
            color: MUTED,
          }}
        >
          {flag && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={flag}
              width={80}
              height={40}
              alt=""
              style={{
                borderRadius: 6,
                boxShadow: "0 0 0 2px rgba(0,0,0,0.12)",
              }}
            />
          )}
          {state.name}
        </div>

        {top && category ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: story ? 34 : 26,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: story ? 230 : 184,
                  fontWeight: 800,
                  lineHeight: 0.9,
                  letterSpacing: -7,
                }}
              >
                {top.ipu}
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 38,
                    fontWeight: 700,
                    background: style.accent,
                    color: darkPill ? "#fff" : INK,
                    borderRadius: 999,
                    padding: "8px 26px",
                  }}
                >
                  {t(category.label)}
                </div>
                <div style={{ display: "flex", fontSize: 26, color: MUTED }}>
                  {t("IPU tertinggi · {station}", { station: top.name })}
                </div>
              </div>
            </div>
            {story && (
              <div
                style={{
                  display: "flex",
                  fontSize: 40,
                  fontWeight: 700,
                  lineHeight: 1.25,
                }}
              >
                {t(adviceFor(category.key).headline)}
              </div>
            )}
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>
              {summary!.unhealthy > 0
                ? t("{n} daripada {total} stesen melebihi IPU 100", {
                    n: summary!.unhealthy,
                    total: summary!.stations.length,
                  })
                : t("Tiada stesen melebihi IPU 100")}
            </div>
            <div
              style={{ display: "flex", height: 2, background: "#ece9e3" }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {rows.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    fontSize: 28,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: 20,
                      height: 20,
                      borderRadius: 99,
                      background: CATEGORY_STYLE[ipuCategory(s.ipu).key].accent,
                    }}
                  />
                  <div style={{ display: "flex", flexGrow: 1 }}>{s.name}</div>
                  <div style={{ display: "flex", fontWeight: 800 }}>
                    {s.ipu}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
            {t("Bacaan APIMS tidak tersedia buat masa ini.")}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 26,
          fontWeight: 600,
        }}
      >
        <div style={{ display: "flex" }}>{t("IPU rasmi APIMS (JAS)")}</div>
        <div style={{ display: "flex", fontWeight: 800 }}>
          {`hezy.my/negeri/${state.id}`}
        </div>
      </div>
    </div>,
    {
      fonts,
      ...CARD_SIZE[format],
      headers: {
        "Cache-Control": "public, max-age=600, s-maxage=900",
      },
    },
  );
}
