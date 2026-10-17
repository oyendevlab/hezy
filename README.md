# Hezy

PWA untuk menyemak Indeks Pencemar Udara (IPU) di Malaysia dengan pantas.

- Production: https://hezy.my
- Keperluan produk: [docs/PRD.md](docs/PRD.md)
- Senarai task: [docs/TASKS.md](docs/TASKS.md)

## Pembangunan

Perlukan Node.js 22 ke atas.

```bash
npm install
npm run dev
```

| Skrip               | Fungsi                                       |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Pelayan pembangunan di http://localhost:3000 |
| `npm run build`     | Build production                             |
| `npm run lint`      | ESLint                                       |
| `npm run typecheck` | Jana jenis laluan dan semak TypeScript       |
| `npm test`          | Ujian unit (Vitest)                          |
| `npm run format`    | Format kod dengan Prettier                   |

## Aliran kerja

Buat cabang `feat/*`, buka PR ke `main`. Vercel akan menghasilkan preview untuk setiap PR, dan gabungan ke `main` akan deploy ke production.

## Sumber data

- **APIMS (Jabatan Alam Sekitar)**: IPU rasmi stesen, nombor utama dan amaran
- **Open-Meteo (CAMS)**: anggaran dan ramalan PM2.5 bila tiada stesen APIMS berdekatan
- **[World Air Quality Index Project](https://waqi.info/)**: lapisan sensor tambahan pada peta (skala AQI AS), melalui `/api/waqi` tanpa cache (terma WAQI). Token di pelayan: `WAQI_TOKEN` (atau `NEXT_PUBLIC_WAQI_TOKEN` lama); tanpa token, lapisan ini tidak dipaparkan
- **MetMalaysia ([data.gov.my](https://data.gov.my/))**: amaran cuaca rasmi dan ramalan ikut daerah, tanah tinggi atau negeri (tanpa kunci; had 4 permintaan/minit), dikongsi semua instans melalui `/api/met` (CDN 15 min)
- **[geoBoundaries](https://www.geoboundaries.org/)**: sempadan daerah Malaysia (ADM2, CC BY 3.0; Runfola et al. 2020) dan negeri/Putrajaya daripada © penyumbang [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL), dipermudahkan dalam `src/lib/places-data.ts` oleh `scripts/build-places.mjs`
