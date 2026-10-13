import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Chevron } from "@/components/chevron";
import { IpuPill } from "@/components/ipu-pill";
import { Notice } from "@/components/status";
import { T } from "@/components/t";
import type { Station } from "@/lib/apims";
import { statesInMapOrder, type State } from "@/lib/areas";
import { getStations } from "@/lib/data";
import { ipuCategory } from "@/lib/ipu";
import { PageTransition } from "@/components/page-transition";

export const metadata: Metadata = {
  title: "IPU mengikut negeri",
  description:
    "IPU rasmi APIMS tertinggi bagi setiap negeri dan wilayah persekutuan di Malaysia.",
  alternates: { canonical: "/negeri" },
};

export default function NegeriIndexPage() {
  return (
    <PageTransition>
      <NegeriIndex />
    </PageTransition>
  );
}

async function NegeriIndex() {
  let stations: Station[] | null;
  try {
    stations = await getStations();
  } catch {
    stations = null;
  }
  const { states, territories } = statesInMapOrder();

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-5 px-5 pt-13 md:px-10 md:pt-10">
      <nav aria-label="Laluan" className="text-muted text-sm font-semibold">
        <Link
          href="/lokasi"
          transitionTypes={["nav-back"]}
          className="underline"
        >
          <T>Lokasi</T>
        </Link>{" "}
        / <T>IPU mengikut negeri</T>
      </nav>
      <h1 className="font-display text-[32px] leading-tight font-bold">
        <T>IPU mengikut negeri</T>
      </h1>
      <p className="text-muted -mt-2 text-sm">
        <T>Tekan negeri untuk melihat IPU setiap kawasan dan stesen.</T>
      </p>
      {stations === null && (
        <Notice>
          <T>Data APIMS tidak dapat diambil buat masa ini.</T>
        </Notice>
      )}
      <StateList title="Negeri" states={states} stations={stations} />
      <StateList
        title="Wilayah Persekutuan"
        states={territories}
        stations={stations}
      />
      <p className="text-muted text-xs">
        <T>
          Sumber: APIMS, Jabatan Alam Sekitar. Dikemas kini setiap 15 minit.
        </T>
      </p>
    </div>
  );
}

function StateList({
  title,
  states,
  stations,
}: {
  title: string;
  states: State[];
  stations: Station[] | null;
}) {
  const id = `senarai-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2.5">
      <h2 id={id} className="text-muted text-sm font-bold tracking-wide">
        <T>{title.toUpperCase()}</T>
      </h2>
      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {states.map((state) => {
          const list =
            stations?.filter(
              (s) => s.stateId === state.apimsStateId && s.ipu !== null,
            ) ?? [];
          const max = list.reduce<number | null>(
            (m, s) => Math.max(m ?? 0, s.ipu ?? 0),
            null,
          );
          return (
            <li key={state.id}>
              <Link
                href={`/negeri/${state.id}`}
                transitionTypes={["nav-forward"]}
                className="bg-surface hover:bg-line flex min-h-16 items-center gap-3 rounded-[18px] py-3 pr-3 pl-4 transition-colors"
              >
                {/* Bendera negeri (hiasan; nama di sebelahnya). Sumber: public/flags/CREDITS.md */}
                <Image
                  src={`/flags/${state.id}.png`}
                  alt=""
                  width={32}
                  height={16}
                  unoptimized
                  data-flag={state.id}
                  className="h-4 w-8 shrink-0 rounded-[3px] shadow-[0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)]"
                />
                <span className="min-w-0 flex-1">
                  <span data-name className="block text-[15px] font-bold">
                    {state.name}
                  </span>
                  <span className="text-muted block text-xs">
                    <T vars={{ n: list.length }}>{"{n} stesen"}</T>
                  </span>
                </span>
                {max !== null && (
                  <span className="flex items-center gap-2">
                    <span className="text-muted text-xs">
                      <T>maks</T>
                    </span>
                    <span className="font-display text-xl font-bold">
                      {max}
                    </span>
                    <IpuPill
                      category={ipuCategory(max).key}
                      label={<T>{ipuCategory(max).label}</T>}
                      className="!px-2 !text-[11px]"
                    />
                  </span>
                )}
                <Chevron />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
