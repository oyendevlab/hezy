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
- [ ] ~~Pintasan papan kekunci (`/`, `1`–`5`, `T`)~~ — tidak diperlukan (keputusan 12 Okt 2026)

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

- [x] ▲ Pembolehubah persekitaran: tiada diperlukan untuk v0.1
- [x] 🐙 Gabung ke `main` → ▲ production `hezy.vercel.app`
- [x] Ujian asap pada production: curl + 33 ujian E2E (`npm run test:e2e:prod`). Telefon sebenar: lihat [UJIAN-TELEFON.md](UJIAN-TELEFON.md)
- [x] ▲ Vercel Web Analytics aktif (Speed Insights melalui CLI perlukan pelan Pro; versi percuma boleh diaktifkan di dashboard)
- [x] Tag versi `v0.1.0` 🐙 (diikuti `v0.2.0` untuk Fasa 8)

## Fasa 8 — Selepas MVP (P1)

- [x] Proksi APIMS (bacaan rasmi): endpoint awam portal eqms.doe.gov.my, cache 15 minit, stesen ≤ 30 km & ≤ 3 jam; `/api/stations` untuk peta
- [x] Peta stesen (Leaflet + OpenStreetMap): 68 stesen APIMS, pin ikut IPU rasmi, senarai stesen terdekat
- [x] Ramalan 3 hari (purata + maks IPU sejam) dan kongsi status (Web Share)
- [ ] Panduan status sekolah → dipindahkan ke Fasa 9 (v0.3.0)
- [x] Notifikasi Web Push (IPU > 100): langganan dalam Vercel Blob (private), semakan setiap jam oleh GitHub Actions, amaran ulang bila kategori berubah / 12 jam, notifikasi pulih

## Fasa 9 — v0.3.0

Fokus: kumpulan sasaran utama (ibu bapa dan pesakit asma), kebolehpercayaan data, dan capaian.
Setiap item dibuat dalam cabang `feat/*` dan PR sendiri; digabung selepas CI lulus.

### 1. Panduan status sekolah (KPM)

- [x] Siasat dan sahkan garis panduan KPM terkini (ambang IPU untuk aktiviti luar dan penutupan sekolah); simpan sumber rasmi dalam kod
- [x] Kad "Status sekolah" di Utama dan Trend, dipaparkan untuk profil **Kanak-kanak** (dan pilihan untuk semua profil)
- [x] Mesej berperingkat ikut IPU rasmi, cth. aktiviti luar dihadkan / sekolah mungkin ditutup — sentiasa dengan nota "ikut makluman rasmi sekolah dan KPM"
- [x] Ujian unit untuk setiap ambang + ujian E2E

### 2. Graf trend rasmi APIMS

- [x] Ambil sejarah IPU sejam stesen terdekat daripada endpoint APIMS `apitablehourly` (cache 15 minit)
- [x] Graf 24 jam: jam lepas = bacaan rasmi APIMS, jam akan datang = ramalan model; legenda membezakan kedua-duanya
- [x] Sandaran ke data model jika APIMS gagal atau stesen tiada bacaan

### 3. Amaran ikut profil kesihatan

- [x] Ambang amaran boleh dipilih: 50 / 100 / 200
- [x] Lalai 50 untuk profil Asma, Kanak-kanak dan Warga emas; 100 untuk Umum
- [x] Ambang disimpan bersama langganan; `decideAlert` menggunakan ambang rekod
- [x] Migrasi: rekod sedia ada tanpa ambang dianggap 100

### 4. Amaran untuk lokasi kegemaran

- [x] Suis amaran pada setiap kad kegemaran (maks 5 lokasi + lokasi semasa)
- [x] Rekod langganan menyimpan senarai lokasi; semakan setiap jam menyemak semua lokasi
- [x] Notifikasi menyebut nama lokasi; amaran berasingan bagi setiap lokasi

### 5. Pemantauan sumber data

- [x] Workflow GitHub harian: semak `/api/stations` (APIMS) dan `/api/aqi` (Open-Meteo) pada production
- [x] Buka _issue_ GitHub secara automatik bila semakan gagal (tanpa pendua jika issue masih terbuka)
- [x] Ringkasan `/api/push/check` (bilangan gagal) turut dipantau

### 6. Bahasa Inggeris

- [x] Kamus teks BM/EN (tanpa pustaka besar); pilihan Bahasa di Tetapan berfungsi
- [x] `<html lang>`, nasihat kesihatan dan notifikasi push ikut bahasa. Metadata, halaman `/negeri` dan `/kongsi` kekal BM kerana dijana di pelayan untuk semua pengguna
- [x] Ujian E2E dalam kedua-dua bahasa

### 7. Imej kongsi automatik

- [x] Imej Open Graph dinamik (`next/og`) untuk status lokasi: IPU, kategori, warna dan logo awan
- [x] Butang Kongsi menghantar pautan yang memaparkan kad bergambar di WhatsApp/Telegram

### 8. Halaman negeri

- [x] Laluan statik `/negeri/[negeri]` untuk 16 negeri/wilayah: IPU semua stesen APIMS, dikemas kini setiap 15 minit
- [x] Metadata SEO, sitemap dan pautan dari peta/senarai
- [x] Ujian kebolehcapaian pada halaman negeri

### 9. Bandingkan lokasi (desktop)

- [x] Pilih 2–3 lokasi (semasa + kegemaran) untuk graf trend dalam satu paparan
- [x] Hanya ≥ 1024 px; telefon kekal satu lokasi

### 10. Lapisan sensor tambahan WAQI

- [x] **Pengguna**: daftar token di aqicn.org/data-platform/token, maklumkan pasukan WAQI melalui e-mel, tambah `NEXT_PUBLIC_WAQI_TOKEN` di Vercel
- [x] Lapisan berasingan pada peta ("Sensor tambahan · skala AQI AS"), pin bergaris, diambil terus dari pelayar (tiada cache pelayan, ikut terma WAQI)
- [x] Atribusi WAQI dan EPA asal; nombor utama dan amaran kekal guna IPU rasmi

### Selesai v0.3.0

- [x] 90+ ujian unit dan E2E lulus pada CI dan production; axe tanpa pelanggaran (126 unit, 65 E2E)
- [x] Lighthouse ≥ 90 dikekalkan (production 12 Okt 2026: telefon 99/100/100/100, desktop 100/100/100/100)
- [x] Kemas kini `UJIAN-TELEFON.md`, versi 0.3.0, tag dan GitHub Release

## Fasa 10 — v0.3.1 (penambahbaikan selepas v0.3.0)

Perubahan yang digabung selepas tag `v0.3.0`, dikeluarkan sebagai versi tampalan sebelum kerja v0.4.0.

- [x] Panduan pasang langkah demi langkah di iPhone/iPad (butang "Cara pasang", termasuk menu ⋯ di iOS 26); iPadOS dikesan dengan betul (PR #24)
- [x] Lapisan sensor tambahan WAQI pada peta (PR #25)
- [ ] Versi 0.3.1 (package.json + Tetapan)
- [ ] `UJIAN-TELEFON.md`: semakan panduan pasang iPhone dan lapisan sensor WAQI
- [ ] Ujian E2E pada production, tag `v0.3.1` dan GitHub Release

## Fasa 11 — v0.4.0 (menunggu pengesahan)

Semua cadangan diterima, ditambah 3 permintaan pengguna (A–C). Setiap kumpulan dibuat dalam cabang dan PR sendiri, digabung selepas CI lulus. Urutan: A–C dahulu (pembaikan UI), kemudian 1–14.

### A. Tarik untuk muat semula (telefon) + muat semula di desktop

- [ ] Telefon: tarik ke bawah di bahagian atas skrin Utama, Trend dan Lokasi → penunjuk awan berpusing → lepas untuk ambil data baharu (tanpa pustaka; `overscroll-behavior` supaya tidak bertembung dengan tarik-muat-semula pelayar)
- [ ] Berfungsi dalam aplikasi yang dipasang (iOS tiada tarik-muat-semula asli dalam mod apl web)
- [ ] Desktop (cadangan): butang ⟳ "Muat semula" di sebelah masa "Dikemas kini", pintasan `R`, dan muat semula automatik bila tab kembali aktif jika data > 10 minit
- [ ] Hormati `prefers-reduced-motion`; ujian E2E (gerak isyarat sentuh dan butang)

### B. Graf trend interaktif

- [ ] Nilai jam semasa dipaparkan secara lalai di atas graf (jam, IPU, kategori, rasmi/anggaran/ramalan)
- [ ] Sentuh dan leret di atas graf untuk melihat nilai setiap jam; penanda menegak mengikut jari/tetikus
- [ ] Papan kekunci: graf boleh difokus, anak panah ←/→ menukar jam (`role="slider"` dengan `aria-valuetext`)
- [ ] Sama untuk graf Bandingkan lokasi (desktop): satu penanda, nilai semua lokasi

### C. Halaman negeri lebih jelas

- [ ] Lokasi: pautan teks diganti dengan butang/kad penuh "IPU mengikut negeri" (ikon peta + ›)
- [ ] Senarai negeri: simbol › pada setiap baris; baris dibawah nama menunjukkan "N stesen" supaya jelas boleh ditekan
- [ ] Susunan ikut peta: Perlis, Kedah, Kelantan, Pulau Pinang, Terengganu, Perak, Pahang, Selangor, Negeri Sembilan, Melaka, Johor, kemudian Sarawak dan Sabah; Wilayah Persekutuan (Kuala Lumpur, Putrajaya, Labuan) di bawah dengan tajuk sendiri
- [ ] Halaman negeri memaparkan stesen ikut kawasan/daerah (APIMS tiada medan daerah rasmi; nama stesen digunakan sebagai kawasan)

### Data dan ramalan

1. **Arah angin & asal jerebu**
   - [ ] Angin 10 m daripada Open-Meteo bersama data sedia ada (tiada token)
   - [ ] Ayat ringkas di Utama, cth. "Angin dari barat daya (arah Sumatera)", dan anak panah angin pada peta
2. **Titik panas kebakaran (NASA FIRMS)**
   - [ ] **Pengguna**: daftar MAP_KEY percuma di firms.modaps.eosdis.nasa.gov/api/map_key dan tambah `FIRMS_MAP_KEY` di Vercel (bukan dalam chat)
   - [ ] API `/api/hotspots` (cache 1 jam): titik VIIRS 24 jam terakhir bagi Malaysia, Sumatera dan Kalimantan
   - [ ] Lapisan "Titik panas" pada peta + bilangan titik panas di Utama bila angin dari arah itu
3. **Sejarah 7 dan 30 hari**
   - [ ] Simpan purata IPU harian stesen APIMS dalam Vercel Blob (tugas harian GitHub Actions) kerana APIMS hanya menyediakan 24 jam
   - [ ] Graf 7/30 hari di Trend (data terkumpul mula dari tarikh dilancarkan)
4. **Ketepatan anggaran**
   - [ ] Bandingkan anggaran model dengan bacaan APIMS bagi stesen yang sama (data sejarah item 3)
   - [ ] Paparkan "biasanya ±N" bila nombor utama ialah anggaran

### Amaran dan rutin harian

5. **Ringkasan pagi**
   - [ ] Pilihan di Tetapan; notifikasi jam 7 pagi dengan IPU dan masa terbaik untuk keluar (workflow sedia ada, semakan jam 7 pagi)
6. **Waktu senyap**
   - [ ] Pilih julat (lalai 11 mlm – 6 pg); amaran ditangguh ke hujung waktu senyap kecuali IPU > 300
7. **Amaran ramalan**
   - [ ] Jam 8 malam: maklumkan jika purata ramalan esok melebihi ambang pengguna

### Ibu bapa, sekolah dan komuniti

8. **Mod guru / sekolah**
   - [ ] Halaman `/sekolah/[negeri]`: status aktiviti luar bagi setiap kawasan stesen
   - [ ] Teks makluman sedia dikongsi kepada ibu bapa (WhatsApp/Telegram)
9. **Senarai semak jerebu**
   - [ ] Senarai persediaan (topeng N95, penapis udara, ubat asma, dll.) ikut profil; tanda siap disimpan di peranti
10. **Bahasa Cina dan Tamil**
    - [ ] Kamus 中文 dan தமிழ் dalam `i18n.ts`, pilihan di Tetapan
    - [ ] **Pengguna**: semakan terjemahan oleh penutur asli sebelum dikeluarkan

### Aplikasi dan kualiti

11. **Pintasan Android**
    - [ ] `shortcuts` dalam manifest: Trend, Peta, Tetapan
12. **Lencana ikon**
    - [ ] Badging API: nombor IPU pada ikon aplikasi bila melebihi ambang (Android/desktop; iOS 16.4+ bila dipasang)
13. **Pemantauan ralat klien**
    - [ ] Endpoint `/api/log` (had kadar, tiada data peribadi) + ralat disimpan dalam Blob; ringkasan dalam semakan harian `pantau.yml`
14. **Keputusan berasaskan data**
    - [ ] Semak Vercel Analytics (halaman popular, peranti, kadar pasang) dan laporkan sebelum item 8–10

### Selesai v0.4.0

- [ ] Semua ujian unit dan E2E lulus pada CI dan production; axe tanpa pelanggaran
- [ ] Lighthouse ≥ 90 dikekalkan
- [ ] Kemas kini `UJIAN-TELEFON.md`, versi 0.4.0, tag dan GitHub Release
