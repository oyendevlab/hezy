# Hezy — Senarai Task (awal hingga deploy)

Rujukan: [PRD.md](PRD.md) · Mockup: [Hezy Mockups](https://claude.ai/artifact/32a5NEFiyVGKsEXRgUmxbp)

Legenda: 🐙 = guna GitHub · ▲ = guna Vercel · ✅ = siap

---

## Fasa 0 — Persediaan

- [x] 🐙 Cipta repo GitHub `oyendevlab/hezy` (public) dan sambungkan folder projek
- [x] 🐙 Tetapkan `main` sebagai cabang utama; kerja baharu dibuat dalam cabang `feat/*` dan digabung melalui PR
- [x] ▲ Cipta projek Vercel bernama **`hezy`** → domain `hezy.vercel.app`
- [x] ▲ Sambungkan repo GitHub ke projek Vercel (deploy automatik: PR → preview, `main` → production)
- [x] Pengurus pakej: npm (pnpm tidak dipasang), Node 22+

## Fasa 1 — Rangka projek

- [x] Scaffold Next.js (App Router) + TypeScript + Tailwind CSS
- [x] ESLint + Prettier, skrip `lint`, `typecheck`, `test`
- [x] Fon: Bricolage Grotesque + Plus Jakarta Sans (`next/font`)
- [x] Token reka bentuk: warna kategori IPU, ink, latar (dari mockup C)
- [x] Susun atur responsif: < 768 px bar bawah, ≥ 768 px bar atas (pilihan 2)
- [ ] 🐙 PR pertama → ▲ semak preview deployment

## Fasa 2 — Data

- [x] Fungsi penukaran PM2.5 → IPU (formula disahkan dengan dokumen JAS) + ujian unit
- [x] Fungsi kategori IPU (label, warna, nasihat ikut profil)
- [x] Route `/api/aqi?lat=&lon=` — ambil data Open-Meteo, cache 15 minit
- [x] Senarai stesen/kawasan (negeri → kawasan) untuk pemilih manual
- [x] Pengendalian ralat di pelayan: tanda data lapuk > 3 jam, ralat 502 bila Open-Meteo gagal (cache di peranti → Fasa 5)

## Fasa 3 — Skrin mudah alih (MVP F1–F5)

- [x] **Utama (C)**: komponen SVG kaki langit (warna + kabus ikut kategori), kad IPU, nasihat, masa kemas kini
- [x] **Trend (G)**: masa terbaik untuk keluar, graf bar 24 jam, purata pagi/petang/malam
- [x] **Lokasi (L)**: lokasi semasa (GPS), kegemaran (maks 5, `localStorage`), carian, togol Senarai/Peta (peta = placeholder "Akan datang")
- [x] **Tetapan (M)**: profil kesihatan, tema, bahasa, maklumat sumber data
- [x] Keadaan khas: skeleton, luar talian, lokasi ditolak, data lapuk, ralat

## Fasa 4 — Tablet & desktop (pilihan 2)

- [x] Banner panorama + kad IPU
- [x] Dua lajur: "Boleh keluar hari ini?" + Nasihat | Trend 24 jam
- [x] Baris lokasi kegemaran (footer sumber data dipaparkan dalam kad IPU)
- [ ] Pintasan papan kekunci (`/`, `1`–`5`, `T`)

## Fasa 5 — PWA (F6–F8)

- [x] `manifest.webmanifest`, ikon 192/512/maskable, ikon Apple (dijana dengan `npm run icons`)
- [x] Service worker (`public/sw.js`, tanpa Serwist): cache halaman + fail statik; bacaan terakhir dalam `localStorage`
- [x] Banner luar talian, butang "Pasang Hezy" (Chromium) dan arahan iOS di Tetapan
- [x] Mod gelap/cerah (ikut peranti, Cerah, Gelap — tanpa kelipan)

## Fasa 6 — Kualiti

- [x] Ujian unit (penukaran IPU, kategori, masa terbaik): 70 ujian Vitest
- [x] Ujian E2E Playwright (telefon + desktop): buka → nampak IPU, tambah lokasi, luar talian, ralat API, tema
- [x] Semakan kebolehcapaian: axe WCAG 2.1 AA pada 4 halaman, mod cerah dan gelap, tiada pelanggaran
- [x] Lighthouse ≥ 90: Performance 96–97, Accessibility 100, Best Practices 96, SEO 100. JS 168 KiB dimampat (React + Next sahaja 115 KiB), sasaran PRD dikemas kini kepada 200 KiB
- [x] 🐙 GitHub Actions: lint + typecheck + format + test + build, dan E2E pada setiap PR

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
