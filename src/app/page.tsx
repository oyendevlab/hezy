const CATEGORIES = [
  {
    range: "0–50",
    label: "Baik",
    className: "bg-ipu-baik-tint text-ipu-baik-ink",
  },
  {
    range: "51–100",
    label: "Sederhana",
    className: "bg-ipu-sederhana-tint text-ipu-sederhana-ink",
  },
  {
    range: "101–200",
    label: "Tidak Sihat",
    className: "bg-ipu-tidak-sihat-tint text-ipu-tidak-sihat-ink",
  },
  {
    range: "201–300",
    label: "Sangat Tidak Sihat",
    className: "bg-ipu-sangat-tidak-sihat-tint text-ipu-sangat-tidak-sihat-ink",
  },
  {
    range: "> 300",
    label: "Berbahaya",
    className: "bg-ipu-berbahaya-tint text-ipu-berbahaya-ink",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 pt-13 md:px-10 md:pt-10">
      <h1 className="font-display text-[30px] font-bold">Hezy</h1>
      <p className="text-muted mt-2 max-w-prose text-[17px]">
        Semak Indeks Pencemar Udara (IPU) di lokasi anda. Bacaan langsung dan
        panorama langit akan dipaparkan di sini selepas Fasa 2 dan 3.
      </p>

      <h2 className="text-muted mt-8 text-sm font-bold tracking-wide">
        KATEGORI IPU
      </h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {CATEGORIES.map((c) => (
          <li key={c.label} className={`rounded-2xl p-4 ${c.className}`}>
            <div className="font-display text-2xl font-bold">{c.range}</div>
            <div className="text-sm font-semibold">{c.label}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
