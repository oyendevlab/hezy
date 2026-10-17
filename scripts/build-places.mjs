// Jana src/lib/places-data.ts (sempadan daerah dan negeri, v0.8.11). Jalankan sekali bila
// sempadan atau senarai lokasi MetMalaysia berubah:
//
//   node scripts/build-places.mjs <adm2.geojson> <adm1.geojson> <metmalaysia-forecast.json>
//
// Sumber (muat turun dahulu):
// - ADM2: https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/MYS/ADM2/geoBoundaries-MYS-ADM2_simplified.geojson
//   (geoBoundaries, citypopulation.de; CC BY 3.0)
// - ADM1: https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/MYS/ADM1/geoBoundaries-MYS-ADM1_simplified.geojson
//   (OpenStreetMap; ODbL 1.0) — negeri setiap daerah, dan poligon Putrajaya (tiada dalam ADM2)
// - Lokasi MetMalaysia: https://api.data.gov.my/weather/forecast/?limit=5000
//
// Setiap gelang dipermudahkan (Douglas–Peucker), pulau sangat kecil dibuang (placeAt jatuh
// ke sempadan terdekat), dan koordinat dikodkan sebagai polyline Google (ketepatan 0.001°).

import { readFileSync, writeFileSync } from "node:fs";

const [adm2Path, adm1Path, metPath] = process.argv.slice(2);
if (!adm2Path || !adm1Path || !metPath) {
  console.error(
    "Guna: node scripts/build-places.mjs <adm2.geojson> <adm1.geojson> <metmalaysia-forecast.json>",
  );
  process.exit(1);
}

/** Toleransi Douglas–Peucker (darjah, ~220 m). */
const TOLERANCE = 0.002;
/** Gelang lebih kecil daripada ini (km²) dibuang. */
const MIN_RING_KM2 = 1;
const PRECISION = 1e3;

const ADM1_STATE = {
  Selangor: "selangor",
  Johor: "johor",
  "Kuala Lumpur": "kuala-lumpur",
  Malacca: "melaka",
  "Negeri Sembilan": "negeri-sembilan",
  Sabah: "sabah",
  Sarawak: "sarawak",
  Kelantan: "kelantan",
  Putrajaya: "putrajaya",
  Terengganu: "terengganu",
  Pahang: "pahang",
  Kedah: "kedah",
  Perlis: "perlis",
  Perak: "perak",
  Penang: "pulau-pinang",
  Labuan: "labuan",
};

/** Nama paparan (ejaan rasmi semasa) bila berbeza daripada geoBoundaries. */
const DISPLAY = {
  "Kecil Lojing": "Lojing",
  Kulaijaya: "Kulai",
  Ledang: "Tangkak",
  Maradong: "Meradong",
  "Nabawan / Persiangan": "Nabawan",
  "Ulu Langat": "Hulu Langat",
  "Ulu Selangor": "Hulu Selangor",
};

/** Nama lokasi ramalan MetMalaysia bila berbeza daripada nama paparan. */
const MET_NAME = {
  "Cameron Highlands": "Tanah Tinggi Cameron",
  "Larut dan Matang": "Larut, Matang Dan Selama",
};
/** Daerah tanpa ramalan daerah tetapi ada ramalan bandar (Tn). */
const MET_TOWN = { Lojing: "Lojing" };

const rings = (geometry) =>
  (geometry.type === "MultiPolygon"
    ? geometry.coordinates
    : [geometry.coordinates]
  ).flat();

function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

/** Gelang genap-ganjil: betul untuk pelbagai poligon dan lubang. */
const inRings = (point, list) =>
  list.reduce(
    (inside, ring) => (inRing(point, ring) ? !inside : inside),
    false,
  );

function ringAreaKm2(ring) {
  const lat0 = ring[0][1];
  const kx = 111.32 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 110.57;
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++)
    sum +=
      ring[j][0] * kx * ring[i][1] * ky - ring[i][0] * kx * ring[j][1] * ky;
  return Math.abs(sum) / 2;
}

function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    let best = -1;
    let bestD = tolerance;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      const d =
        len === 0
          ? Math.hypot(px - ax, py - ay)
          : Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
      if (d > bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best >= 0) {
      keep[best] = 1;
      stack.push([a, best], [best, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function encode(points) {
  let out = "";
  let lastLat = 0;
  let lastLon = 0;
  const push = (value) => {
    let v = value < 0 ? ~(value << 1) : value << 1;
    while (v >= 0x20) {
      out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    out += String.fromCharCode(v + 63);
  };
  for (const [lon, lat] of points) {
    const la = Math.round(lat * PRECISION);
    const lo = Math.round(lon * PRECISION);
    push(la - lastLat);
    push(lo - lastLon);
    lastLat = la;
    lastLon = lo;
  }
  return out;
}

/** Gelang dipermudahkan dan dikodkan; gelang kecil dibuang. */
function packRings(list) {
  return list
    .filter((ring) => ringAreaKm2(ring) >= MIN_RING_KM2)
    .map((ring) => simplify(ring.slice(0, -1), TOLERANCE))
    .filter((ring) => ring.length >= 3)
    .map(encode);
}

const adm2 = JSON.parse(readFileSync(adm2Path, "utf8")).features;
const adm1 = JSON.parse(readFileSync(adm1Path, "utf8")).features.map((f) => ({
  state: ADM1_STATE[f.properties.shapeName],
  rings: rings(f.geometry),
}));
if (adm1.some((s) => !s.state)) throw new Error("Negeri ADM1 tidak dikenali");

/** Negeri daerah: undian titik grid di dalam daerah (titik di sempadan tidak menentukan). */
function stateOf(list) {
  const xs = list.flat().map((p) => p[0]);
  const ys = list.flat().map((p) => p[1]);
  const [x0, x1, y0, y1] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  const votes = {};
  const n = 24;
  for (let i = 0; i <= n; i++)
    for (let j = 0; j <= n; j++) {
      const p = [x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * j) / n];
      if (!inRings(p, list)) continue;
      const s = adm1.find((st) => inRings(p, st.rings))?.state;
      if (s) votes[s] = (votes[s] ?? 0) + 1;
    }
  const ranked = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0];
}

const metRows = JSON.parse(readFileSync(metPath, "utf8"));
const metIds = new Map();
for (const row of Array.isArray(metRows) ? metRows : metRows.data) {
  const { location_id: id, location_name: name } = row.location;
  if (id.startsWith("Ds") || id.startsWith("Tn"))
    metIds.set(`${id.slice(0, 2)}:${name.toLowerCase()}`, id);
}

const districts = [];
const putrajaya = adm1.find((s) => s.state === "putrajaya");
districts.push(["Putrajaya", "putrajaya", "Ds062", packRings(putrajaya.rings)]);

const unmatched = [];
for (const feature of adm2) {
  const source = feature.properties.shapeName;
  const name = DISPLAY[source] ?? source;
  const list = rings(feature.geometry);
  const state = stateOf(list);
  if (!state) throw new Error(`Negeri tidak ditemui: ${source}`);
  const metName = (MET_NAME[name] ?? name).toLowerCase();
  const met =
    metIds.get(`Ds:${metName}`) ??
    (MET_TOWN[name]
      ? metIds.get(`Tn:${MET_TOWN[name].toLowerCase()}`)
      : undefined) ??
    null;
  if (!met) unmatched.push(name);
  districts.push([name, state, met, packRings(list)]);
}

const body = districts
  .map(
    ([name, state, met, packed]) =>
      `  [${JSON.stringify(name)}, ${JSON.stringify(state)}, ${JSON.stringify(met)}, ${JSON.stringify(packed)}],`,
  )
  .join("\n");

writeFileSync(
  "src/lib/places-data.ts",
  `// Dijana oleh scripts/build-places.mjs — jangan sunting dengan tangan.
// Sempadan daerah: geoBoundaries gbOpen MYS ADM2 (2020; geoBoundaries, citypopulation.de),
// CC BY 3.0 — Runfola et al. (2020), PLoS ONE 15(4): e0231866.
// Negeri setiap daerah dan sempadan Putrajaya: geoBoundaries MYS ADM1 daripada
// © penyumbang OpenStreetMap, ODbL 1.0 (https://www.openstreetmap.org/copyright).
// Dipermudahkan (Douglas–Peucker ${TOLERANCE}°), gelang < ${MIN_RING_KM2} km² dibuang, polyline ketepatan ${1 / PRECISION}°.
// Putrajaya disenaraikan dahulu kerana poligon Sepang dalam ADM2 merangkuminya.

/** [nama daerah, id negeri (areas.ts), id ramalan MetMalaysia, gelang polyline]. */
export type DistrictRow = readonly [
  name: string,
  state: string,
  met: string | null,
  rings: readonly string[],
];

export const POLYLINE_PRECISION = ${PRECISION};

export const DISTRICTS: readonly DistrictRow[] = [
${body}
];
`,
);

const chars = districts.reduce(
  (n, d) => n + d[3].reduce((m, r) => m + r.length, 0),
  0,
);
console.log(
  `${districts.length} daerah, ${(chars / 1024).toFixed(0)} KB polyline`,
);
console.log("Tiada ramalan daerah MetMalaysia:", unmatched.join(", ") || "-");
for (const [name, state, met] of districts)
  console.log(`  ${state.padEnd(16)} ${name.padEnd(24)} ${met ?? "-"}`);
