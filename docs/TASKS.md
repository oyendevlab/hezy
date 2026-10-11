# Hezy — Senarai Task (awal hingga deploy)

Rujukan: [PRD.md](PRD.md) · Mockup: [Hezy Mockups](https://claude.ai/artifact/32a5NEFiyVGKsEXRgUmxbp)

Legenda: 🐙 = guna GitHub · ▲ = guna Vercel · ✅ = siap

---

## Fasa 0 — Persediaan

- [x] 🐙 Cipta repo GitHub `oyendevlab/hezy` (public) dan sambungkan folder projek
- [x] 🐙 Tetapkan `main` sebagai cabang utama; kerja baharu dibuat dalam cabang `feat/*` dan digabung melalui PR
- [x] ▲ Cipta projek Vercel bernama **`hezy`** → domain `hezy.vercel.app`
- [x] ▲ Sambungkan repo GitHub ke projek Vercel (deploy automatik: PR → preview, `main` → production)
- [ ] Pasang pnpm, sahkan Node 22+

## Fasa 1 — Rangka projek

- [ ] Scaffold Next.js (App Router) + TypeScript + Tailwind CSS
- [ ] ESLint + Prettier, skrip `lint`, `typecheck`, `test`
- [ ] Fon: Bricolage Grotesque + Plus Jakarta Sans (`next/font`)
- [ ] Token reka bentuk: warna kategori IPU, ink, latar (dari mockup C)
- [ ] Susun atur responsif: < 768 px bar bawah, ≥ 768 px bar atas (pilihan 2)
- [ ] 🐙 PR pertama → ▲ semak preview deployment

## Fasa 2 — Data

- [ ] Fungsi penukaran PM2.5 → IPU (sahkan formula dengan dokumen JAS) + ujian unit
- [ ] Fungsi kategori IPU (label, warna, nasihat ikut profil)
- [ ] Route `/api/aqi?lat=&lon=` — ambil data Open-Meteo, cache 15 minit
- [ ] Senarai stesen/kawasan (negeri → kawasan) untuk pemilih manual
- [ ] Pengendalian ralat: data lapuk > 3 jam, API gagal → guna cache

## Fasa 3 — Skrin mudah alih (MVP F1–F5)

- [ ] **Utama (C)**: komponen SVG kaki langit (warna + kabus ikut kategori), kad IPU, nasihat, masa kemas kini
- [ ] **Trend (G)**: masa terbaik untuk keluar, graf bar 24 jam, purata pagi/petang/malam
- [ ] **Lokasi (L)**: lokasi semasa (GPS), kegemaran (maks 5, `localStorage`), carian, togol Senarai/Peta (peta = placeholder "Akan datang")
- [ ] **Tetapan (M)**: profil kesihatan, tema, bahasa, maklumat sumber data
- [ ] Keadaan khas: skeleton, luar talian, lokasi ditolak, data lapuk, ralat

## Fasa 4 — Tablet & desktop (pilihan 2)

- [ ] Banner panorama + kad IPU
- [ ] Dua lajur: "Boleh keluar hari ini?" + Nasihat | Trend 24 jam
- [ ] Baris lokasi kegemaran, footer sumber data
- [ ] Pintasan papan kekunci (`/`, `1`–`5`, `T`)

## Fasa 5 — PWA (F6–F8)

- [ ] `manifest.webmanifest`, ikon 192/512/maskable, splash
- [ ] Service worker (Serwist): cache shell + bacaan terakhir
- [ ] Banner luar talian, butang "Pasang Hezy"
- [ ] Mod gelap/cerah

## Fasa 6 — Kualiti

- [ ] Ujian unit (penukaran IPU, kategori, masa terbaik)
- [ ] Ujian E2E Playwright: buka → nampak IPU, tambah lokasi, luar talian
- [ ] Semakan kebolehcapaian (kontras, label, papan kekunci)
- [ ] Lighthouse ≥ 90 (Performance, Accessibility, Best Practices), bundle < 150 KB gzip
- [ ] 🐙 GitHub Actions: lint + typecheck + test pada setiap PR

## Fasa 7 — Deploy

- [ ] ▲ Pembolehubah persekitaran (jika ada) di Vercel
- [ ] 🐙 Gabung ke `main` → ▲ production `hezy.vercel.app`
- [ ] Ujian asap pada production (telefon Android + iPhone, pasang PWA)
- [ ] ▲ Aktifkan Vercel Analytics / Speed Insights
- [ ] Tag versi `v0.1.0` 🐙

## Fasa 8 — Selepas MVP (P1)

- [ ] Proksi APIMS (bacaan rasmi), label "Anggaran" untuk Open-Meteo
- [ ] Peta stesen (Leaflet + OpenStreetMap)
- [ ] Ramalan 3 hari, kongsi status (Web Share)
- [ ] Panduan status sekolah (sahkan ambang KPM)
- [ ] Notifikasi Web Push (IPU > 100)
