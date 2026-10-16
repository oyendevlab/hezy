import { OG_FONT_FAMILY, ogFonts } from "@/lib/og-fonts";
import { LOGO_DATA_URL } from "@/lib/logo-art";
import { ImageResponse } from "next/og";
import { adviceFor } from "@/lib/advice";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { translate } from "@/lib/i18n";
import { ipuCategory } from "@/lib/ipu";
import { findState } from "@/lib/areas";
import { flagDataUrl } from "@/lib/flag-image";
import { CARD_SIZE, parseCard } from "@/lib/share-card";

const INK = "#1c1a16";
const MUTED = "#5a564e";
const SCALE_MAX = 200;

/**
 * GET /kongsi/kad?n=…&i=…&s=…&h=…&k=…&t=…&l=ms&f=square|story
 * Imej kad IPU terkini untuk dikongsi sebagai gambar (chat 1080×1080, Status 1080×1920).
 */
export async function GET(request: Request) {
  const card = parseCard(Object.fromEntries(new URL(request.url).searchParams));
  if (!card) {
    return new Response("Parameter kad tidak sah.", { status: 400 });
  }
  const t = (text: string, vars?: Record<string, string | number>) =>
    translate(card.lang, text, vars);
  const size = CARD_SIZE[card.format];
  const story = card.format === "story";
  const style = CATEGORY_STYLE[card.category];
  const darkPill = card.category === "baik" || card.category === "sederhana";
  const chartHeight = story ? 340 : 200;
  const flag = await flagDataUrl(card.state, request.url);
  const stateName = card.state ? findState(card.state)?.name : undefined;

  const fonts = await ogFonts(request.url);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: story ? "120px 72px" : "64px 72px",
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
          <img src={LOGO_DATA_URL} width={64} height={64} alt="" />
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800 }}>
            Hezy
          </div>
        </div>
        {card.made && (
          <div style={{ display: "flex", fontSize: 28, fontWeight: 600 }}>
            {card.made}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: story ? 40 : 28,
          background: "#fff",
          borderRadius: 48,
          padding: story ? "56px 56px" : "44px 52px",
        }}
      >
        {/* Kiri: bendera (selari dengan atas nombor) dan nama; kanan: IPU, tahap, sumber, masa. */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              paddingTop: story ? 30 : 22,
              minWidth: 0,
              flex: 1,
            }}
          >
            {flag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={flag}
                width={84}
                height={42}
                alt=""
                style={{
                  borderRadius: 6,
                  boxShadow: "0 0 0 2px rgba(0,0,0,0.12)",
                }}
              />
            )}
            <div
              style={{
                display: "flex",
                fontSize: story ? 60 : 52,
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              {t(card.name)}
            </div>
            {stateName && stateName !== card.name && (
              <div style={{ display: "flex", fontSize: 28, color: MUTED }}>
                {t(stateName)}
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: story ? 240 : 190,
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: -8,
              }}
            >
              {card.ipu}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 38,
                fontWeight: 700,
                background: style.accent,
                color: darkPill ? "#fff" : INK,
                borderRadius: 999,
                padding: "6px 24px",
              }}
            >
              {t(card.label)}
            </div>
            <div style={{ display: "flex", fontSize: 24, color: MUTED }}>
              {t(card.source === "apims" ? "APIMS (JAS)" : "Anggaran PM2.5")}
            </div>
            {card.time && (
              <div style={{ display: "flex", fontSize: 24, color: MUTED }}>
                {t("Bacaan {time}", { time: card.time })}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: story ? 44 : 38,
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          {t(adviceFor(card.category).headline)}
        </div>

        {card.hours.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 24,
                color: MUTED,
              }}
            >
              <div style={{ display: "flex", fontWeight: 700, color: INK }}>
                {t("Bacaan IPU per jam")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      width: 12,
                      height: 22,
                      borderRadius: 3,
                      background: style.accent,
                    }}
                  />
                  {t(card.source === "apims" ? "Rasmi" : "Anggaran")}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      width: 12,
                      height: 22,
                      borderRadius: 3,
                      background: style.accent,
                      opacity: 0.45,
                    }}
                  />
                  {t("Ramalan")}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      width: 0,
                      height: 24,
                      borderLeft: `3px dashed ${INK}`,
                    }}
                  />
                  {t("Kini")}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 6,
                height: chartHeight,
                position: "relative",
              }}
            >
              {card.hours.map((v, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flex: 1,
                    borderRadius: 6,
                    height:
                      v === null
                        ? 6
                        : Math.max(
                            6,
                            Math.round(
                              (Math.min(v, SCALE_MAX) / SCALE_MAX) *
                                chartHeight,
                            ),
                          ),
                    background:
                      v === null
                        ? "#e4e0d8"
                        : CATEGORY_STYLE[ipuCategory(v).key].accent,
                    opacity: card.now >= 0 && i > card.now ? 0.45 : 1,
                  }}
                />
              ))}
              {card.now >= 0 && (
                <div
                  style={{
                    display: "flex",
                    position: "absolute",
                    top: -10,
                    bottom: 0,
                    left: `${((card.now + 0.5) / card.hours.length) * 100}%`,
                    width: 0,
                    borderLeft: `3px dashed ${INK}`,
                  }}
                />
              )}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 22,
                fontWeight: 600,
                color: MUTED,
              }}
            >
              <div style={{ display: "flex" }}>12 AM</div>
              <div style={{ display: "flex" }}>12 PM</div>
              <div style={{ display: "flex" }}>11 PM</div>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 30,
          fontWeight: 600,
        }}
      >
        <div style={{ display: "flex" }}>
          {t("Semak jerebu di lokasi anda")}
        </div>
        <div style={{ display: "flex", fontWeight: 800 }}>hezy.my</div>
      </div>
    </div>,
    {
      fonts,
      ...size,
      headers: { "Cache-Control": "public, max-age=600, s-maxage=3600" },
    },
  );
}
