import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StationTable } from "@/components/station-table";
import { Notice, Skeleton } from "@/components/status";
import type { Station } from "@/lib/apims";
import { STATES, findState } from "@/lib/areas";
import { getStations } from "@/lib/data";
import { ipuCategory } from "@/lib/ipu";

export function generateStaticParams() {
  return STATES.map((s) => ({ negeri: s.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/negeri/[negeri]">): Promise<Metadata> {
  const state = findState((await params).negeri);
  if (!state) return {};
  return {
    title: `IPU ${state.name} hari ini`,
    description: `Bacaan Indeks Pencemar Udara (IPU) rasmi semua stesen APIMS di ${state.name}, dikemas kini setiap jam.`,
    alternates: { canonical: `/negeri/${state.id}` },
  };
}

async function stationsFor(apimsStateId: number): Promise<Station[] | null> {
  try {
    return (await getStations()).filter((s) => s.stateId === apimsStateId);
  } catch {
    return null;
  }
}

async function StateContent({
  params,
}: {
  params: PageProps<"/negeri/[negeri]">["params"];
}) {
  const state = findState((await params).negeri);
  if (!state) notFound();
  const stations = await stationsFor(state.apimsStateId);
  const withReading = stations?.filter((s) => s.ipu !== null) ?? [];
  const highest = withReading.reduce<Station | null>(
    (a, s) => (a && (a.ipu ?? 0) >= (s.ipu ?? 0) ? a : s),
    null,
  );
  const latest = withReading
    .map((s) => s.time ?? "")
    .sort()
    .at(-1);
  const unhealthy = withReading.filter((s) => (s.ipu ?? 0) > 100).length;

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-5 px-5 pt-13 md:px-10 md:pt-10">
      <nav aria-label="Laluan" className="text-muted text-sm font-semibold">
        <Link href="/negeri" className="underline">
          Semua negeri
        </Link>{" "}
        / {state.name}
      </nav>
      <h1 className="font-display text-[32px] leading-tight font-bold">
        IPU {state.name} hari ini
      </h1>

      {stations === null ? (
        <Notice>
          Data APIMS tidak dapat diambil buat masa ini. Cuba lagi sebentar.
        </Notice>
      ) : (
        <>
          <p className="text-[16px]">
            {withReading.length} stesen dengan bacaan
            {highest?.ipu != null && (
              <>
                {" "}
                · tertinggi <strong>{highest.name}</strong> ({highest.ipu},{" "}
                {ipuCategory(highest.ipu).label})
              </>
            )}{" "}
            ·{" "}
            {unhealthy > 0
              ? `${unhealthy} stesen melebihi IPU 100`
              : "tiada stesen melebihi IPU 100"}
            .
          </p>
          <StationTable
            stations={stations}
            caption={`IPU rasmi stesen APIMS di ${state.name}`}
          />
          <p className="text-muted text-xs">
            Sumber: APIMS, Jabatan Alam Sekitar
            {latest ? ` · bacaan terkini ${latest.replace("T", " ")}` : ""}.
            Dikemas kini setiap 15 minit.
          </p>
        </>
      )}

      <Link
        href="/"
        className="bg-ink text-page flex min-h-13 items-center justify-center rounded-2xl font-semibold"
      >
        Semak lokasi saya dengan Hezy
      </Link>
    </div>
  );
}

export default function NegeriPage({ params }: PageProps<"/negeri/[negeri]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[960px] px-5 pt-13 md:px-10 md:pt-10">
          <Skeleton className="h-96" />
        </div>
      }
    >
      <StateContent params={params} />
    </Suspense>
  );
}
