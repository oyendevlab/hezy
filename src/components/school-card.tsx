import type { PrimaryReading } from "@/lib/official";
import { schoolStatus, type SchoolLevel } from "@/lib/school";

const LEVEL_CLASS: Record<SchoolLevel, string> = {
  normal: "bg-ipu-sederhana-tint text-ipu-sederhana-ink",
  "no-outdoor": "bg-ipu-tidak-sihat-tint text-ipu-tidak-sihat-ink",
  closed: "bg-ipu-berbahaya-tint text-ipu-berbahaya-ink",
};

/** Kad panduan status sekolah (KPM) berdasarkan nombor IPU utama. */
export function SchoolCard({ reading }: { reading: PrimaryReading }) {
  const status = schoolStatus(reading.ipu);
  return (
    <section
      aria-labelledby="status-sekolah"
      className={`rounded-[22px] p-4.5 ${LEVEL_CLASS[status.level]}`}
    >
      <div className="flex items-center gap-2 text-[13px] font-bold tracking-wide">
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 10 12 5l9 5-9 5z" />
          <path d="M7 12v5c0 1 2.2 2.5 5 2.5s5-1.5 5-2.5v-5" />
        </svg>
        STATUS SEKOLAH
      </div>
      <h2
        id="status-sekolah"
        className="font-display mt-1 text-2xl leading-tight font-bold"
      >
        {status.title}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed font-medium">
        {status.detail}
      </p>
      <p className="mt-2 text-xs font-semibold">
        Panduan sahaja (
        {reading.source === "apims" ? "IPU rasmi" : "anggaran IPU"}{" "}
        {reading.ipu}). Keputusan rasmi dibuat oleh sekolah, PPD dan JPN.
      </p>
    </section>
  );
}
