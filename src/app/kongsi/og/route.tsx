import { ImageResponse } from "next/og";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { parseShare } from "@/lib/share";

/** GET /kongsi/og?n=Shah+Alam&i=72&s=apims — imej kad kongsi 1200×630. */
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const data = parseShare(params);
  const style = CATEGORY_STYLE[data?.category ?? "sederhana"];

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
        <svg width="72" height="72" viewBox="0 0 512 512">
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
              fontSize: 40,
              fontWeight: 700,
              color: "#5a564e",
            }}
          >
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
        hezy.vercel.app
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    },
  );
}
