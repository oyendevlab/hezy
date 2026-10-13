import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { IpuPill } from "@/components/ipu-pill";
import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/status";
import { T } from "@/components/t";
import { parseShare } from "@/lib/share";
import { PageTransition } from "@/components/page-transition";

export async function generateMetadata({
  searchParams,
}: PageProps<"/kongsi">): Promise<Metadata> {
  const params = await searchParams;
  const data = parseShare(params);
  const title = data
    ? `IPU ${data.name}: ${data.ipu} (${data.label})`
    : "Semak jerebu";
  const query = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) =>
      typeof v === "string" ? [[k, v]] : [],
    ),
  );
  const image = `/kongsi/og?${query}`;
  return {
    title,
    description:
      "Semak Indeks Pencemaran Udara (IPU) di lokasi anda dengan Hezy.",
    openGraph: {
      title: `${title} · Hezy`,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

async function SharedCard({
  searchParams,
}: {
  searchParams: PageProps<"/kongsi">["searchParams"];
}) {
  const data = parseShare(await searchParams);
  return (
    <div className="bg-surface rounded-3xl p-6">
      {data ? (
        <>
          <div className="text-muted text-sm font-semibold">
            <T>{data.name}</T>
          </div>
          <div className="mt-1 flex items-center gap-4">
            <span className="font-display text-7xl font-bold">{data.ipu}</span>
            <IpuPill category={data.category} label={<T>{data.label}</T>} />
          </div>
          <p className="text-muted mt-2 text-xs">
            <T>
              {data.source === "apims"
                ? "IPU rasmi APIMS (JAS) semasa dikongsi. Bacaan terkini mungkin berbeza."
                : "Anggaran IPU daripada PM2.5 semasa dikongsi. Bacaan terkini mungkin berbeza."}
            </T>
          </p>
        </>
      ) : (
        <p className="font-semibold">
          <T>Pautan kongsi ini tidak sah.</T>
        </p>
      )}
    </div>
  );
}

export default function KongsiPage({ searchParams }: PageProps<"/kongsi">) {
  return (
    <PageTransition>
      <div className="mx-auto flex max-w-md flex-col gap-5 px-5 pt-13 md:pt-16">
        <Logo size={64} />
        <h1 className="font-display text-[30px] leading-tight font-bold">
          <T>Status jerebu yang dikongsi</T>
        </h1>
        <Suspense fallback={<Skeleton className="h-40" />}>
          <SharedCard searchParams={searchParams} />
        </Suspense>
        <Link
          href="/"
          className="bg-ink text-page flex min-h-13 items-center justify-center rounded-2xl font-semibold"
        >
          <T>Semak lokasi saya dengan Hezy</T>
        </Link>
      </div>
    </PageTransition>
  );
}
