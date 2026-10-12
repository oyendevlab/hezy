import type { Coords } from "./coords";

/** Kawasan untuk pemilih lokasi manual (bila GPS ditolak). Koordinat ialah anggaran pusat bandar. */
export type Area = Coords & { id: string; name: string };
export type State = {
  id: string;
  name: string;
  /** ID negeri dalam APIMS (STATE_ID). */
  apimsStateId: number;
  areas: Area[];
};

const area = (id: string, name: string, lat: number, lon: number): Area => ({
  id,
  name,
  lat,
  lon,
});

/** Susunan negeri ikut peta: Semenanjung dari utara ke selatan, kemudian Borneo. */
const STATE_MAP_ORDER = [
  "perlis",
  "kedah",
  "kelantan",
  "pulau-pinang",
  "terengganu",
  "perak",
  "pahang",
  "selangor",
  "negeri-sembilan",
  "melaka",
  "johor",
  "sarawak",
  "sabah",
];
const FEDERAL_TERRITORIES = ["kuala-lumpur", "putrajaya", "labuan"];

export const STATES: readonly State[] = [
  {
    id: "johor",
    apimsStateId: 1,
    name: "Johor",
    areas: [
      area("johor-bahru", "Johor Bahru", 1.49, 103.74),
      area("batu-pahat", "Batu Pahat", 1.85, 102.93),
      area("muar", "Muar", 2.04, 102.57),
      area("kluang", "Kluang", 2.03, 103.32),
      area("kota-tinggi", "Kota Tinggi", 1.73, 103.9),
    ],
  },
  {
    id: "kedah",
    apimsStateId: 2,
    name: "Kedah",
    areas: [
      area("alor-setar", "Alor Setar", 6.12, 100.37),
      area("sungai-petani", "Sungai Petani", 5.65, 100.49),
      area("kulim", "Kulim", 5.37, 100.56),
      area("langkawi", "Langkawi", 6.35, 99.8),
    ],
  },
  {
    id: "kelantan",
    apimsStateId: 3,
    name: "Kelantan",
    areas: [
      area("kota-bharu", "Kota Bharu", 6.13, 102.24),
      area("tanah-merah", "Tanah Merah", 5.8, 102.15),
      area("kuala-krai", "Kuala Krai", 5.53, 102.2),
    ],
  },
  {
    id: "melaka",
    apimsStateId: 4,
    name: "Melaka",
    areas: [
      area("bandaraya-melaka", "Bandaraya Melaka", 2.19, 102.25),
      area("alor-gajah", "Alor Gajah", 2.38, 102.21),
    ],
  },
  {
    id: "negeri-sembilan",
    apimsStateId: 5,
    name: "Negeri Sembilan",
    areas: [
      area("seremban", "Seremban", 2.73, 101.94),
      area("nilai", "Nilai", 2.82, 101.8),
      area("port-dickson", "Port Dickson", 2.52, 101.8),
    ],
  },
  {
    id: "pahang",
    apimsStateId: 6,
    name: "Pahang",
    areas: [
      area("kuantan", "Kuantan", 3.81, 103.33),
      area("temerloh", "Temerloh", 3.45, 102.42),
      area("jerantut", "Jerantut", 3.94, 102.36),
      area("cameron-highlands", "Cameron Highlands", 4.47, 101.38),
    ],
  },
  {
    id: "perak",
    apimsStateId: 8,
    name: "Perak",
    areas: [
      area("ipoh", "Ipoh", 4.6, 101.08),
      area("taiping", "Taiping", 4.85, 100.74),
      area("teluk-intan", "Teluk Intan", 4.02, 101.02),
      area("seri-manjung", "Seri Manjung", 4.21, 100.66),
    ],
  },
  {
    id: "perlis",
    apimsStateId: 9,
    name: "Perlis",
    areas: [area("kangar", "Kangar", 6.44, 100.2)],
  },
  {
    id: "pulau-pinang",
    apimsStateId: 7,
    name: "Pulau Pinang",
    areas: [
      area("george-town", "George Town", 5.41, 100.33),
      area("seberang-jaya", "Seberang Jaya", 5.4, 100.4),
      area("balik-pulau", "Balik Pulau", 5.35, 100.23),
    ],
  },
  {
    id: "sabah",
    apimsStateId: 12,
    name: "Sabah",
    areas: [
      area("kota-kinabalu", "Kota Kinabalu", 5.98, 116.07),
      area("sandakan", "Sandakan", 5.84, 118.12),
      area("tawau", "Tawau", 4.25, 117.89),
      area("keningau", "Keningau", 5.34, 116.16),
    ],
  },
  {
    id: "sarawak",
    apimsStateId: 13,
    name: "Sarawak",
    areas: [
      area("kuching", "Kuching", 1.55, 110.36),
      area("sri-aman", "Sri Aman", 1.24, 111.46),
      area("sibu", "Sibu", 2.3, 111.82),
      area("bintulu", "Bintulu", 3.17, 113.04),
      area("miri", "Miri", 4.4, 113.99),
    ],
  },
  {
    id: "selangor",
    apimsStateId: 10,
    name: "Selangor",
    areas: [
      area("shah-alam", "Shah Alam", 3.07, 101.52),
      area("petaling-jaya", "Petaling Jaya", 3.11, 101.61),
      area("klang", "Klang", 3.04, 101.45),
      area("kajang", "Kajang", 2.99, 101.79),
      area("banting", "Banting", 2.81, 101.5),
      area("kuala-selangor", "Kuala Selangor", 3.34, 101.25),
    ],
  },
  {
    id: "terengganu",
    apimsStateId: 11,
    name: "Terengganu",
    areas: [
      area("kuala-terengganu", "Kuala Terengganu", 5.33, 103.14),
      area("kemaman", "Kemaman", 4.23, 103.42),
      area("besut", "Besut", 5.83, 102.55),
    ],
  },
  {
    id: "kuala-lumpur",
    apimsStateId: 14,
    name: "W.P. Kuala Lumpur",
    areas: [
      area("kuala-lumpur", "Kuala Lumpur", 3.14, 101.69),
      area("cheras", "Cheras", 3.09, 101.74),
      area("batu-muda", "Batu Muda", 3.21, 101.68),
    ],
  },
  {
    id: "putrajaya",
    apimsStateId: 16,
    name: "W.P. Putrajaya",
    areas: [area("putrajaya", "Putrajaya", 2.93, 101.69)],
  },
  {
    id: "labuan",
    apimsStateId: 15,
    name: "W.P. Labuan",
    areas: [area("labuan", "Labuan", 5.28, 115.24)],
  },
];

export function findArea(id: string): (Area & { state: string }) | undefined {
  for (const state of STATES) {
    const found = state.areas.find((a) => a.id === id);
    if (found) return { ...found, state: state.name };
  }
  return undefined;
}

/** Kawasan terdekat (jarak kasar) untuk menamakan koordinat GPS. */
export function nearestArea(
  lat: number,
  lon: number,
): Area & { state: string } {
  let best: (Area & { state: string }) | null = null;
  let bestDistance = Infinity;
  for (const state of STATES) {
    for (const a of state.areas) {
      const dLat = a.lat - lat;
      const dLon = (a.lon - lon) * Math.cos((lat * Math.PI) / 180);
      const distance = dLat * dLat + dLon * dLon;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { ...a, state: state.name };
      }
    }
  }
  return best as Area & { state: string };
}

/** Cari kawasan atau negeri mengikut nama (tidak peka huruf besar/kecil). */
export function searchAreas(
  query: string,
  limit = 8,
): (Area & { state: string })[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return STATES.flatMap((s) =>
    s.areas
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
      )
      .map((a) => ({ ...a, state: s.name })),
  ).slice(0, limit);
}

export function findState(id: string): State | undefined {
  return STATES.find((s) => s.id === id);
}

export function findStateByApimsId(
  apimsStateId: number | null,
): State | undefined {
  return STATES.find((s) => s.apimsStateId === apimsStateId);
}

/** Negeri ikut susunan peta dan Wilayah Persekutuan secara berasingan. */
export function statesInMapOrder(): { states: State[]; territories: State[] } {
  const pick = (ids: string[]) =>
    ids.map((id) => STATES.find((s) => s.id === id)!).filter(Boolean);
  return {
    states: pick(STATE_MAP_ORDER),
    territories: pick(FEDERAL_TERRITORIES),
  };
}
