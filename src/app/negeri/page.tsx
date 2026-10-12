import type { Metadata } from "next";
import Link from "next/link";
import { IpuPill } from "@/components/ipu-pill";
import { Notice } from "@/components/status";
import type { Station } from "@/lib/apims";
import { STATES } from "@/lib/areas";
import { getStations } from "@/lib/data";
import { ipuCategory } from "@/lib/ipu";

export const metadata: Metadata = {
  title: "IPU mengikut negeri",
  description:
    "IPU rasmi APIMS tertinggi bagi setiap negeri dan wilayah persekutuan di Malaysia.",
  alternates: { canonical: "/negeri" },
};

export default async function NegeriIndexPage() {
  let stations: Station[] | null;
  try {
    stations = await getStations();
  } catch {
    stations = null;
  }

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-5 px-5 pt-13 md:px-10 md:pt-10">
      <h1 className="font-display text-[32px] leading-tight font-bold">
        IPU mengikut negeri
      </h1>
      {stations === null && (
        <Notice>Data APIMS tidak dapat diambil buat masa ini.</Notice>
      )}
      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {[...STATES]
          .sort((a, b) => a.name.localeCompare(b.name, "ms"))
          .map((state) => {
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
                  className="bg-surface flex min-h-16 items-center justify-between gap-3 rounded-[18px] px-4 py-3"
                >
                  <span>
                    <span className="block text-[15px] font-bold">
                      {state.name}
                    </span>
                    <span className="text-muted block text-xs">
                      {list.length} stesen
                    </span>
                  </span>
                  {max !== null && (
                    <span className="flex items-center gap-2">
                      <span className="text-muted text-xs">maks</span>
                      <span className="font-display text-xl font-bold">
                        {max}
                      </span>
                      <IpuPill
                        category={ipuCategory(max).key}
                        label={ipuCategory(max).label}
                        className="!px-2 !text-[11px]"
                      />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
      </ul>
      <p className="text-muted text-xs">
        Sumber: APIMS, Jabatan Alam Sekitar. Dikemas kini setiap 15 minit.
      </p>
    </div>
  );
}
