import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { BottomNav, TopNav } from "@/components/app-nav";
import { OfflineBanner, PwaSetup } from "@/components/pwa";
import { SITE_URL } from "@/lib/site";
import { THEME_BOOT_SCRIPT } from "@/lib/storage-keys";
import "./globals.css";
import { startupImages } from "@/lib/splash";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Hezy — Semak Jerebu",
    template: "%s · Hezy",
  },
  description:
    "Semak Indeks Pencemaran Udara (IPU) di lokasi anda dengan pantas.",
  applicationName: "Hezy",
  appleWebApp: {
    capable: true,
    title: "Hezy",
    statusBarStyle: "default",
    startupImage: startupImages(),
  },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121316" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ms"
      className={`${jakarta.variable} ${bricolage.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <PwaSetup />
        <OfflineBanner />
        <TopNav />
        <main className="flex-1 pb-28 md:pb-12">{children}</main>
        <BottomNav />
        <Analytics />
      </body>
    </html>
  );
}
