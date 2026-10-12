import { ImageResponse } from "next/og";
import { adviceFor } from "@/lib/advice";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { translate } from "@/lib/i18n";
import { ipuCategory } from "@/lib/ipu";
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
        fontFamily: "sans-serif",
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
          <svg width="64" height="64" viewBox="0 0 512 512">
            <rect width="512" height="512" rx="120" fill="#bfe0f5" />
            <circle cx="175" cy="290" r="85" fill="#fff" />
            <circle cx="262" cy="225" r="112" fill="#fff" />
            <circle cx="350" cy="292" r="82" fill="#fff" />
            <ellipse cx="262" cy="332" rx="172" ry="62" fill="#fff" />
            <ellipse cx="228" cy="295" rx="15" ry="20" fill="#1e2430" />
            <ellipse cx="298" cy="295" rx="15" ry="20" fill="#1e2430" />
            <circle cx="196" cy="324" r="15" fill="#f7b5b5" />
            <circle cx="330" cy="324" r="15" fill="#f7b5b5" />
          </svg>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800 }}>
            Hezy
          </div>
        </div>
        {card.time && (
          <div style={{ display: "flex", fontSize: 30, fontWeight: 600 }}>
            {card.time}
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
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 40,
              fontWeight: 700,
              color: MUTED,
            }}
          >
            {t(card.name)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 42,
                  fontWeight: 700,
                  background: style.accent,
                  color: darkPill ? "#fff" : INK,
                  borderRadius: 999,
                  padding: "8px 26px",
                }}
              >
                {t(card.label)}
              </div>
              <div style={{ display: "flex", fontSize: 26, color: MUTED }}>
                {t(
                  card.source === "apims"
                    ? "IPU rasmi APIMS (JAS)"
                    : "Anggaran IPU daripada PM2.5",
                )}
              </div>
            </div>
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
                fontSize: 26,
                fontWeight: 700,
                color: MUTED,
              }}
            >
              {t("Hari ini, jam demi jam")}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 6,
                height: chartHeight,
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
                    border: i === card.now ? `4px solid ${INK}` : "none",
                  }}
                />
              ))}
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
              <div style={{ display: "flex" }}>{t("12 pg")}</div>
              <div style={{ display: "flex" }}>{t("12 tgh")}</div>
              <div style={{ display: "flex" }}>{t("11 mlm")}</div>
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
        <div style={{ display: "flex", fontWeight: 800 }}>hezy.vercel.app</div>
      </div>
    </div>,
    {
      ...size,
      headers: { "Cache-Control": "public, max-age=600, s-maxage=3600" },
    },
  );
}
