// Semak sumber data Hezy pada production. Jalankan: npm run monitor
// Keluar dengan kod 1 (dan cetak ringkasan) jika ada semakan gagal.

const BASE = process.env.HEZY_URL ?? "https://hezy.vercel.app";
const MAX_AGE_HOURS = 6;

/** Jam semasa waktu Malaysia, `YYYY-MM-DDTHH:00`. */
function malaysiaHourKey(now = new Date()) {
  const my = new Date(now.getTime() + 8 * 3_600_000);
  return `${my.toISOString().slice(0, 13)}:00`;
}

const hoursSince = (time) =>
  (Date.parse(`${malaysiaHourKey()}:00Z`) - Date.parse(`${time}:00Z`)) /
  3_600_000;

async function getJson(path) {
  const res = await fetch(BASE + path, { signal: AbortSignal.timeout(30_000) });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

const checks = [
  {
    name: "APIMS: /api/stations",
    async run() {
      const { status, body } = await getJson("/api/stations");
      if (status !== 200)
        return `status ${status}: ${body?.error ?? "tiada mesej"}`;
      const stations = body?.stations ?? [];
      const withReading = stations.filter((s) => s.ipu !== null);
      if (stations.length < 50)
        return `hanya ${stations.length} stesen (jangkaan ≥ 50)`;
      if (withReading.length < 30)
        return `hanya ${withReading.length} stesen dengan bacaan (jangkaan ≥ 30)`;
      const latest = withReading
        .map((s) => s.time)
        .sort()
        .at(-1);
      if (!latest || hoursSince(latest) > MAX_AGE_HOURS)
        return `bacaan terkini ${latest ?? "tiada"} lebih ${MAX_AGE_HOURS} jam lalu`;
      return null;
    },
  },
  {
    name: "Open-Meteo + APIMS: /api/aqi (Shah Alam)",
    async run() {
      const { status, body } = await getJson("/api/aqi?lat=3.07&lon=101.52");
      if (status !== 200)
        return `status ${status}: ${body?.error ?? "tiada mesej"}`;
      if (!body?.current) return "tiada bacaan semasa (model)";
      if (body.stale) return `bacaan model lapuk (${body.current.time})`;
      if (!body.official)
        return "tiada bacaan rasmi APIMS untuk stesen Shah Alam";
      if (!body.today?.some((h) => h.officialIpu != null))
        return "tiada sejarah rasmi setiap jam";
      return null;
    },
  },
  {
    name: "Sejarah: /api/history (Shah Alam CA20B)",
    async run() {
      const { status, body } = await getJson("/api/history?station=CA20B");
      if (status !== 200)
        return `status ${status}: ${body?.error ?? "tiada mesej"}`;
      // Pengumpul berjalan setiap 3 jam: semalam atau hari ini mesti ada data.
      const recent = (body?.days ?? []).slice(-2);
      if (!recent.some((d) => d.max !== null))
        return "tiada data sejarah untuk semalam atau hari ini (pengumpul tidak berjalan?)";
      return null;
    },
  },
  {
    name: "Ketepatan: /api/accuracy",
    async run() {
      const { status, body } = await getJson("/api/accuracy");
      if (status !== 200)
        return `status ${status}: ${body?.error ?? "tiada mesej"}`;
      if (!body?.updatedAt) return "indeks ketepatan belum wujud";
      const age = (Date.now() - Date.parse(body.updatedAt)) / 3_600_000;
      if (age > 30)
        return `indeks ketepatan tidak dikemas kini sejak ${Math.round(age)} jam`;
      console.log(
        `   anggaran ±${body.estimate ?? "–"} · ramalan ±${body.forecast ?? "–"} (asal ±${body.forecastRaw ?? "–"}) · ${body.days} hari`,
      );
      return null;
    },
  },
  {
    name: "Open-Meteo: /api/aqi (Kuching)",
    async run() {
      const { status, body } = await getJson("/api/aqi?lat=1.55&lon=110.36");
      if (status !== 200)
        return `status ${status}: ${body?.error ?? "tiada mesej"}`;
      if (!body?.current || body.stale)
        return "tiada bacaan semasa atau bacaan lapuk";
      return null;
    },
  },
];

const failures = [];
for (const check of checks) {
  let problem;
  try {
    problem = await check.run();
  } catch (error) {
    problem = `ralat: ${error instanceof Error ? error.message : String(error)}`;
  }
  console.log(
    `${problem ? "✗" : "✓"} ${check.name}${problem ? ` — ${problem}` : ""}`,
  );
  if (problem) failures.push(`- **${check.name}**: ${problem}`);
}

if (failures.length > 0) {
  const summary = [
    `Semakan pada ${new Date().toISOString()} (${BASE}):`,
    "",
    ...failures,
  ].join("\n");
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFileSync } = await import("node:fs");
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  }
  if (process.env.MONITOR_REPORT) {
    const { writeFileSync } = await import("node:fs");
    writeFileSync(process.env.MONITOR_REPORT, summary);
  }
  process.exit(1);
}
