// Semak sumber data Hezy pada production. Jalankan: npm run monitor
// Keluar dengan kod 1 (dan cetak ringkasan) jika ada semakan gagal.

const BASE = process.env.HEZY_URL ?? "https://hezy.my";
const MAX_AGE_HOURS = 6;
/** Jurang maksimum antara semakan amaran (push-check.yml) dalam 24 jam lepas (v0.8.4). */
const MAX_ALERT_GAP_HOURS = 2;

/** Jurang terbesar (jam) antara masa larian dalam tempoh [start, end], termasuk kedua-dua hujung. */
function maxGapHours(times, start, end) {
  const points = [start, ...times.filter((t) => t >= start && t <= end), end];
  let gap = 0;
  for (let i = 1; i < points.length; i++)
    gap = Math.max(gap, points[i] - points[i - 1]);
  return gap / 3_600_000;
}

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
        `   anggaran ±${body.estimate ?? "–"} · ramalan ±${body.forecast ?? "–"} (asal ±${body.forecastRaw ?? "–"}) · ${body.days} hari · model E (bayang) ±${body.forecastJas ?? "–"} · ${body.jasDays ?? 0} hari`,
      );
      return null;
    },
  },
  {
    name: "MetMalaysia: /api/met",
    async run() {
      const { status, body } = await getJson("/api/met");
      if (status !== 200)
        return `status ${status}: ${body?.error ?? "tiada mesej"}`;
      const ids = Object.keys(body?.forecasts ?? {});
      if (!ids.some((id) => id.startsWith("Ds")))
        return `tiada ramalan daerah (${ids.length} lokasi)`;
      const age = (Date.now() - Date.parse(body.fetchedAt)) / 3_600_000;
      // CDN 15 min + stale-while-revalidate: salinan > 6 jam bermakna data.gov.my gagal lama.
      if (!(age <= 6))
        return `salinan MetMalaysia berusia ${Math.round(age)} jam`;
      console.log(
        `   ${ids.length} lokasi ramalan, ${body.warnings.length} amaran, salinan ${Math.round(age * 60)} min`,
      );
      return null;
    },
  },
  {
    name: "Titik panas: /api/hotspots (NASA FIRMS)",
    async run() {
      const { status, body } = await getJson("/api/hotspots");
      if (status !== 200)
        return `status ${status}: ${body?.error ?? "tiada mesej"}`;
      if (!Array.isArray(body?.cells)) return "tiada senarai sel titik panas";
      console.log(`   ${body.cells.length} sel titik panas (2 hari)`);
      return null;
    },
  },
  {
    name: "Ralat klien: /api/log/summary",
    async run() {
      const secret = process.env.CRON_SECRET;
      if (!secret) {
        console.log("   (dilangkau: CRON_SECRET tiada)");
        return null;
      }
      const res = await fetch(`${BASE}/api/log/summary`, {
        headers: { Authorization: `Bearer ${secret}` },
        signal: AbortSignal.timeout(30_000),
      });
      const body = await res.json().catch(() => null);
      if (res.status !== 200)
        return `status ${res.status}: ${body?.error ?? "tiada mesej"}`;
      console.log(
        `   ${body.unique} ralat unik, ${body.total} laporan sejak ${body.from}`,
      );
      for (const e of body.top.slice(0, 5))
        console.log(
          `   · ${e.count}× ${e.message} (${e.path}, ${e.browser}, v${e.version})`,
        );
      // Gagal (buka issue) hanya bila ralat banyak, supaya ralat terpencil tidak bising.
      if (body.unique >= 5 || body.total >= 50)
        return `${body.unique} ralat unik / ${body.total} laporan: ${body.top
          .slice(0, 3)
          .map((e) => `${e.count}× ${e.message}`)
          .join("; ")}`;
      return null;
    },
  },
  {
    name: "Jadual: semakan amaran (push-check.yml, 24 jam)",
    async run() {
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        console.log("   (dilangkau: GITHUB_TOKEN tiada)");
        return null;
      }
      const repo = process.env.GITHUB_REPOSITORY ?? "oyendevlab/hezy";
      const end = Date.now();
      const start = end - 24 * 3_600_000;
      const params = new URLSearchParams({
        per_page: "100",
        created: `>=${new Date(start).toISOString()}`,
      });
      const res = await fetch(
        `https://api.github.com/repos/${repo}/actions/workflows/push-check.yml/runs?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          },
          signal: AbortSignal.timeout(30_000),
        },
      );
      if (!res.ok) return `API GitHub memulangkan status ${res.status}`;
      const { workflow_runs: runs = [] } = await res.json();
      // Larian yang selesai (berjaya atau ada notifikasi gagal) bermakna semakan berlaku.
      const times = runs
        .filter((r) => r.conclusion === "success" || r.conclusion === "failure")
        .map((r) => Date.parse(r.run_started_at ?? r.created_at))
        .sort((a, b) => a - b);
      const gap = maxGapHours(times, start, end);
      console.log(
        `   ${times.length} larian dalam 24 jam, jurang terbesar ${gap.toFixed(1)} jam`,
      );
      if (gap > MAX_ALERT_GAP_HOURS)
        return `jurang ${gap.toFixed(1)} jam antara semakan amaran (had ${MAX_ALERT_GAP_HOURS} jam; ${times.length} larian dalam 24 jam) — amaran IPU mungkin lewat`;
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
