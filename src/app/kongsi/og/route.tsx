import { LOGO_DATA_URL } from "@/lib/logo-art";
import { ImageResponse } from "next/og";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { flagDataUrl } from "@/lib/flag-image";
import { parseShare } from "@/lib/share";

/** GET /kongsi/og?n=Shah+Alam&i=72&s=apims — imej kad kongsi 1200×630. */
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const data = parseShare(params);
  const style = CATEGORY_STYLE[data?.category ?? "sederhana"];
  const flag = await flagDataUrl(data?.state, request.url);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: style.sky.sky,
        color: "#1c1a16",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- imej next/og */}
        <img src={LOGO_DATA_URL} width={72} height={72} alt="" />
        <div style={{ display: "flex", fontSize: 44, fontWeight: 800 }}>
          Hezy
        </div>
      </div>

      {data ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "#fff",
            borderRadius: 40,
            padding: "40px 48px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontSize: 40,
              fontWeight: 700,
              color: "#5a564e",
            }}
          >
            {flag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={flag}
                width={72}
                height={36}
                alt=""
                style={{
                  borderRadius: 5,
                  boxShadow: "0 0 0 2px rgba(0,0,0,0.12)",
                }}
              />
            )}
            {data.name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 36,
              marginTop: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 180,
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: -6,
              }}
            >
              {data.ipu}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 44,
                  fontWeight: 700,
                  background: style.accent,
                  color:
                    data.category === "sederhana" || data.category === "baik"
                      ? "#fff"
                      : "#1c1a16",
                  borderRadius: 999,
                  padding: "10px 28px",
                }}
              >
                {data.label}
              </div>
              <div style={{ display: "flex", fontSize: 30, color: "#5a564e" }}>
                {data.source === "apims"
                  ? "IPU rasmi APIMS (JAS)"
                  : "Anggaran IPU daripada PM2.5"}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", fontSize: 64, fontWeight: 800 }}>
          Semak jerebu di lokasi anda
        </div>
      )}

      <div style={{ display: "flex", fontSize: 30, fontWeight: 600 }}>
        hezy.my
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    },
  );
}
