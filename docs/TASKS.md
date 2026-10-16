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
- [x] Lighthouse ≥ 90 dikekalkan (production: telefon 92/100/100/100, desktop 100/100/100/100) (production 12 Okt 2026: telefon 99/100/100/100, desktop 100/100/100/100)
- [x] Kemas kini `UJIAN-TELEFON.md`, versi 0.3.0, tag dan GitHub Release

## Fasa 10 — v0.3.1 (penambahbaikan selepas v0.3.0)

Perubahan yang digabung selepas tag `v0.3.0`, dikeluarkan sebagai versi tampalan sebelum kerja v0.4.0.

- [x] Panduan pasang langkah demi langkah di iPhone/iPad (butang "Cara pasang", termasuk menu ⋯ di iOS 26); iPadOS dikesan dengan betul (PR #24)
- [x] Lapisan sensor tambahan WAQI pada peta (PR #25)
- [x] Versi 0.3.1 (package.json + Tetapan)
- [x] `UJIAN-TELEFON.md`: semakan panduan pasang iPhone dan lapisan sensor WAQI
- [x] Ujian E2E pada production, tag `v0.3.1` dan GitHub Release

## Fasa 11 — v0.4.0

Disahkan 12 Okt 2026. Setiap kumpulan dibuat dalam cabang dan PR sendiri, digabung selepas CI lulus.
Urutan: v0.3.1 → A, B, C → 15 → 3 → 4 → D → 1, 2 → 5, 6, 7 → 11–14. Item 8, 9 dan 10 ditangguhkan (KIV).

### A. Tarik untuk muat semula (telefon) + muat semula di desktop

- [x] Telefon: tarik ke bawah di bahagian atas skrin Utama, Trend dan Lokasi → penunjuk awan berpusing → lepas untuk ambil data baharu (tanpa pustaka; `overscroll-behavior` supaya tidak bertembung dengan tarik-muat-semula pelayar)
- [x] Berfungsi dalam aplikasi yang dipasang (iOS tiada tarik-muat-semula asli dalam mod apl web)
- [x] Desktop (cadangan): butang ⟳ "Muat semula" di sebelah masa "Dikemas kini", pintasan `R`, dan muat semula automatik bila tab kembali aktif jika data > 10 minit
- [x] Hormati `prefers-reduced-motion`; ujian E2E (gerak isyarat sentuh dan butang)

### B. Graf trend interaktif

- [x] Nilai jam semasa dipaparkan secara lalai di atas graf (jam, IPU, kategori, rasmi/anggaran/ramalan)
- [x] Sentuh dan leret di atas graf untuk melihat nilai setiap jam; penanda menegak mengikut jari/tetikus
- [x] Papan kekunci: graf boleh difokus, anak panah ←/→ menukar jam (`role="slider"` dengan `aria-valuetext`)
- [x] Sama untuk graf Bandingkan lokasi (desktop): satu penanda, nilai semua lokasi

### C. Halaman negeri lebih jelas

- [x] Lokasi: pautan teks diganti dengan butang/kad penuh "IPU mengikut negeri" (ikon peta + ›)
- [x] Senarai negeri: simbol › pada setiap baris; baris dibawah nama menunjukkan "N stesen" supaya jelas boleh ditekan
- [x] Susunan ikut peta: Perlis, Kedah, Kelantan, Pulau Pinang, Terengganu, Perak, Pahang, Selangor, Negeri Sembilan, Melaka, Johor, kemudian Sarawak dan Sabah; Wilayah Persekutuan (Kuala Lumpur, Putrajaya, Labuan) di bawah dengan tajuk sendiri
- [x] Halaman negeri memaparkan stesen ikut kawasan/daerah (APIMS tiada medan daerah rasmi; nama stesen digunakan sebagai kawasan)

### D. Kongsi paparan indeks terkini (menggantikan item 8–10 dalam v0.4.0)

- [x] Butang Kongsi menjana imej kad (IPU, kategori, lokasi, nasihat, masa, graf mini 24 jam) dan menghantarnya sebagai gambar melalui Web Share (`navigator.share({ files })`), bersama pautan Hezy
- [x] Dua format: segi empat (chat) dan menegak 9:16 (Status/Story); sandaran muat turun imej jika pelayar tidak menyokong kongsi fail

### 15. Pembetulan ramalan (keutamaan selepas A–C)

Masalah: model CAMS (Open-Meteo) kurang menganggar jerebu. Contoh Putrajaya 12 Okt 2026, 12 tgh: APIMS 153, model 70.

- [x] Pembetulan = median (PM2.5 setara APIMS − PM2.5 model) bagi 6 jam terakhir (offset tambah; nisbah darab diuji tetapi membesarkan lonjakan model hingga IPU ~288), had ±200 µg/m³
- [x] Offset berkurang secara linear ke 0 dalam 48 jam; jam semasa yang belum diterbitkan APIMS turut dibetulkan; graf berterusan
- [x] 6 jam pertama dicampur dengan bacaan rasmi terakhir (persistence)
- [x] Masa terbaik, purata pagi/petang/malam dan ramalan 3 hari menggunakan nilai yang dibetulkan; label "Ramalan dibetulkan" (amaran ramalan item 7 akan menggunakannya)
- [ ] Kemudian: nisbah per stesen dan ikut waktu daripada sejarah item 3
- [x] Ujian unit dengan data sebenar 12 Okt sebagai kes ujian

### Data dan ramalan

1. **Arah angin & asal jerebu**
   - [x] Angin paras 850 hPa (~1.5 km) daripada Open-Meteo, purata vektor ±3 jam (angin 10 m terlalu berubah-ubah); tiada token
   - [x] Ayat ringkas di Utama, cth. "Angin dari barat daya (arah Sumatera)", dan anak panah angin pada peta; asal ditentukan dengan menyemak Sumatera/Kalimantan dalam 600 km ke hulu angin
2. **Titik panas kebakaran (NASA FIRMS)**
   - [x] **Pengguna**: daftar MAP_KEY percuma di firms.modaps.eosdis.nasa.gov/api/map_key; `FIRMS_MAP_KEY` ditambah di Vercel (sensitif)
   - [x] API `/api/hotspots` (cache 1 jam): titik VIIRS SNPP + NOAA-20 2 hari terakhir (data terkini ialah laluan satelit terakhir) bagi Malaysia, Sumatera dan Kalimantan, digabung ikut sel ~5 km
   - [x] Lapisan "Titik panas" pada peta (kanvas, boleh dimatikan) + bilangan titik panas di hulu angin (±30°, 600 km) pada baris angin di Utama
3. **Sejarah IPU: heatmap gaya GitHub** (sumber: APIMS sahaja; data WAQI tidak boleh disimpan mengikut terma mereka)
   - [x] Tugas harian GitHub Actions menyimpan IPU sejam semua stesen APIMS dalam Vercel Blob; isi awal 7 hari lepas (had sejarah endpoint APIMS)
   - [x] Heatmap 12 minggu di Trend: satu kotak sehari, warna ikut IPU maksimum harian; ketik kotak → tarikh, maksimum dan purata
   - [x] Legenda warna ikut kategori APIMS: Baik 0–50 (biru), Sederhana 51–100 (hijau), Tidak Sihat 101–200 (kuning), Sangat Tidak Sihat 201–300 (jingga), Berbahaya > 300 (merah), Kecemasan > 500; kotak kelabu = tiada data
   - [x] Semakan harian `pantau.yml`: data sejarah semalam/hari ini wujud
4. **Ketepatan anggaran**
   - [x] Bandingkan anggaran model dengan bacaan APIMS bagi stesen yang sama (data sejarah item 3)
   - [x] Paparkan "biasanya ±N" bila nombor utama ialah anggaran, dan "ramalan ±N" pada graf
   - [x] Semakan harian ketepatan ramalan semalam (MAE sebelum/selepas pembetulan item 15) dalam `pantau.yml`

### Amaran dan rutin harian

5. **Ringkasan pagi**
   - [x] Pilihan di Tetapan; notifikasi jam 7 pagi dengan IPU dan masa terbaik untuk keluar (workflow sedia ada, semakan jam 7 pagi)
6. **Waktu senyap**
   - [x] Pilih julat (lalai 11 mlm – 6 pg); amaran ditangguh ke hujung waktu senyap kecuali IPU > 300
7. **Amaran ramalan**
   - [x] Jam 8 malam: maklumkan jika purata ramalan esok melebihi ambang pengguna

### Ibu bapa, sekolah dan komuniti

8. **Mod guru / sekolah** — KIV
   - [ ] Halaman `/sekolah/[negeri]`: status aktiviti luar bagi setiap kawasan stesen
   - [ ] Teks makluman sedia dikongsi kepada ibu bapa (WhatsApp/Telegram)
9. **Senarai semak jerebu** — KIV
   - [ ] Senarai persediaan (topeng N95, penapis udara, ubat asma, dll.) ikut profil; tanda siap disimpan di peranti
10. **Bahasa Cina dan Tamil** — KIV
    - [ ] Kamus 中文 dan தமிழ் dalam `i18n.ts`, pilihan di Tetapan
    - [ ] **Pengguna**: semakan terjemahan oleh penutur asli sebelum dikeluarkan

### Aplikasi dan kualiti

11. **Pintasan Android**
    - [x] `shortcuts` dalam manifest: Trend, Peta, Tetapan
12. **Lencana ikon**
    - [x] Badging API: nombor IPU pada ikon aplikasi bila melebihi ambang (Android/desktop; iOS 16.4+ bila dipasang)
13. **Pemantauan ralat klien**
    - [x] Endpoint `/api/log` (had kadar, tiada data peribadi) + ralat disimpan dalam Blob; ringkasan dalam semakan harian `pantau.yml`
14. **Keputusan berasaskan data**
    - [x] Semak Vercel Analytics (halaman popular, peranti, kadar pasang) dan laporkan untuk keputusan item KIV
    - Laporan 11–12 Okt 2026 (data bermula 11 Okt; termasuk ujian pasukan, jadi sampel kecil): **19 pelawat, 274 paparan**
      - Peranti: telefon 12 pelawat (179 paparan), desktop 7 (95); **iOS 10 pelawat** (Mobile Safari 9), Android 2, Windows 4, Mac 2
      - Halaman: Utama 114, Lokasi 58, Trend 56, Tetapan 30, /negeri 11, /negeri/[negeri] 4, /kongsi 1
      - Negara: Malaysia 14 pelawat (267 paparan); hampir semua akses terus (tiada perujuk)
      - Kesimpulan: pengguna iPhone majoriti → keutamaan pada panduan pasang iOS dan notifikasi iOS (perlu dipasang); halaman negeri dan kongsi masih jarang digunakan; tiada data untuk menyokong item KIV 8–10 lagi — semak semula selepas musim jerebu dengan lebih ramai pengguna. Acara tersuai (cth. pilihan bahasa, butang kongsi) memerlukan pelan Vercel Pro, jadi tidak diaktifkan
15. **Model pembelajaran mesin untuk ramalan — KIV**
    - [ ] Nilai selepas ≥ 3 bulan data sejarah (item 3) dan keputusan ketepatan (item 4): model kecil (cth. regresi/gradient boosting) dengan input CAMS, bacaan rasmi terakhir, titik panas, angin dan waktu
    - [ ] Hanya digunakan jika lebih tepat daripada pembetulan nisbah item 15; tanya pengguna dahulu jika memerlukan perkhidmatan berbayar

### Selesai v0.4.0

- [x] Semua ujian unit dan E2E lulus pada CI dan production; axe tanpa pelanggaran (185 unit, 99 E2E tempatan / 97 production)
- [x] Lighthouse ≥ 90 dikekalkan (production 12 Okt 2026: telefon 99/100/100/100, desktop 100/100/100/100)
- [x] Kemas kini `UJIAN-TELEFON.md`, versi 0.4.0, tag dan GitHub Release

## Fasa 12 — v0.5.0

Fokus: rupa yang lebih hidup, pengalaman iPhone, dan domain sendiri. Setiap kumpulan dalam cabang dan PR sendiri.
Urutan: 10 → A → B → C → D → 1 → 8 → 9.

### 10. Domain hezy.my

- [x] Tambah `hezy.my` dan `www.hezy.my` ke projek Vercel
- [x] **Pengguna**: di Hostinger (hPanel → DNS), tukar rekod `A @` kepada `76.76.21.21` (buang `A`/`AAAA` lama 2.57.91.91); `www` kekal CNAME ke `hezy.my` atau `A www 76.76.21.21`
- [x] `hezy.my` jadi domain utama: `www` dan `hezy.vercel.app` ubah hala 308 ke `hezy.my` (tiada banner pindah — pengguna masih sedikit)
- [x] Kemas kini `SITE_URL`, sitemap, imej kongsi, `VAPID_SUBJECT`, workflow (push, sejarah, ketepatan, pantau) dan E2E production ke `hezy.my`
- [x] Nota: tetapan dan langganan amaran terikat pada domain; pengguna sedia ada perlu memilih lokasi dan menghidupkan amaran semula

### A. Langit hidup (Utama)

- [x] Data cuaca Open-Meteo (tanpa token): litupan awan, jarak penglihatan, siang/malam, matahari terbit/terbenam, kod cuaca, suhu
- [x] Shader WebGL ringan (tanpa three.js, ~5–8 KB): warna langit ikut IPU + jarak penglihatan (jernih → kelabu-kuning berjerebu), awan bergerak ikut litupan dan arah angin, matahari pudar dalam jerebu
- [x] Malam: bulan (fasa sebenar) dan bintang berkelip yang pudar bila jerebu tebal; senja dan subuh; titisan hujan bila hujan
- [x] Menara KL dibuang untuk semua lokasi; langit penuh
- [x] Dimuat selepas paparan pertama, berhenti bila tab tidak aktif; imej statik untuk `prefers-reduced-motion` dan peranti tanpa WebGL; Lighthouse ≥ 90 dikekalkan

### B. Bacaan utama dan cuaca (Utama)

- [x] Label "IPU" di atas nombor; penanda sumber ("Rasmi · APIMS" / "Anggaran")
- [x] Ikon cuaca semasa + suhu di sebelah kanan (cth. "31° Berawan"); siang/malam
- [x] Ikon garisan pada bento nasihat (topeng, tingkap, air, dll.) — Phosphor (duotone), pilihan pengguna

### C. Trend

- [x] Pengepala: lokasi sebagai cip (📍 lokasi ⌄) ke tab Lokasi; IPU dibuang dari pengepala (berulang dengan baris KINI di atas graf, pilihan pengguna)
- [x] Graf: tekan dan seret untuk melihat jam lain; lepas → kembali ke jam semasa (butang "Kembali" dibuang); tetikus keluar / fokus beralih → kembali
- [x] Baris bacaan tinggi tetap (masa | nombor + pil | sumber) supaya tidak melompat semasa diseret
- [x] Ikon kecil pada bento Pagi/Petang/Malam dan ikon cuaca harian pada Ramalan 3 hari

### D. Lokasi

- [x] Tab **Peta | Senarai**; Peta dipaparkan dahulu
- [x] Kegemaran yang sama dengan lokasi semasa ditanda "semasa" (tidak diulang)

### E. Nama lokasi GPS

- [x] Lokasi GPS dinamakan ikut bandar terdekat tanpa "Berhampiran" (cth. "Putrajaya"); lokasi tersimpan dimigrasi secara automatik

### 1. Banner pasang Hezy (iPhone/iPad)

- [x] Di Utama untuk Safari yang belum memasang Hezy: "Pasang Hezy untuk amaran dan akses pantas" → panduan 4 langkah; boleh ditutup (tidak muncul semula 14 hari)

### 8. Halaman Privasi

- [x] `/privasi` (BM/EN): lokasi dan tetapan hanya di peranti; langganan notifikasi (lokasi dibundarkan ~1 km) sehingga amaran dimatikan; log ralat tanpa data peribadi 14 hari; Vercel Web Analytics tanpa kuki; sumber data pihak ketiga (APIMS, Open-Meteo, NASA FIRMS, WAQI); cara padam data
- [x] Pautan dari Tetapan dan kaki halaman

### 9. Halaman negeri dan kongsi dalam English

- [x] Halaman `/negeri`, `/negeri/[negeri]` dan `/kongsi` mengikut bahasa pengguna (BM/EN); metadata kekal BM untuk SEO

### Selesai v0.5.0

- [x] Semua ujian unit dan E2E lulus pada CI dan production (`hezy.my`); axe tanpa pelanggaran (197 unit, 107 E2E; ralat rangkaian tempatan ERR_TIMED_OUT diulang dan lulus)
- [x] Lighthouse ≥ 90 dikekalkan dengan langit WebGL (production 12 Okt 2026: telefon 98/100/100/100, desktop 100/100/100/100, /trend 99/100/100/100)
- [x] Kemas kini `UJIAN-TELEFON.md`, versi 0.5.0, tag dan GitHub Release

## Fasa 13 — v0.5.1 (penambahbaikan Utama)

Penambahbaikan sebelum ciri baharu. Cadangan v0.6.0 (notifikasi ujian, semalam vs sebenar, pembetulan ikut stesen, pencemar utama, amaran lonjakan, amaran jerebu dijangka, peta haba, aliran angin, mod gambar negeri) **KIV**.

### A. Pengepala tetap

- [x] Cip lokasi dan butang kongsi (dan ⟳ di desktop) kekal di atas semasa menatal
- [x] ~~Latar kaca kabur yang semakin pekat bila menatal~~ → dibuang atas maklum balas pengguna (jalur putih lutsinar); cip kekal terapung dengan latar pil sendiri (bayang halus di desktop)
- [x] Bila nombor IPU besar keluar dari skrin, pengepala memaparkan versi ringkas dalam pil: "152 · Tidak Sihat"

### B. Langit tetap dan kad putih elastik (telefon)

- [x] Langit tetap di belakang (`position: fixed`, ~560 px); hanya kad putih yang bergerak dan menutup langit bila ditatal; animasi diperlahankan bila langit hampir tertutup
- [x] Tarik ke bawah di atas halaman: kad turun dengan rintangan seperti getah, dihadkan ~140 px
- [x] Lepas sebelum ambang (~64 px): kad melantun semula (spring dengan sedikit lajakan); selepas ambang: kad berhenti ~64 px, awan berputar di ruang langit, dan melantun semula bila data siap
- [x] Kad sentiasa memenuhi hingga bawah skrin (langit tidak kelihatan di bawah kad)
- [x] Tiada lantunan untuk `prefers-reduced-motion`; desktop kekal panorama (⟳ dan kekunci R); Trend dan Lokasi kekal dengan penunjuk sedia ada

### C. Angin dan titik panas berikon

- [x] Baris angin: ikon _Wind_ (Phosphor) + anak panah kecil arah tiupan + "Angin dari tenggara · 8 km/j"
- [x] Baris titik panas: ikon _Fire_ (Phosphor, jingga) + bilangan ditebalkan, cth. "**33** titik panas di hulu angin · 2 hari"

### D. Baris sumber ringkas

- [x] Ringkas: "Stesen Putrajaya · 1.1 km · 8:00 malam" (atau "Anggaran model · dikemas kini 8:00 malam")
- [x] Butang ⓘ membuka butiran: sumber penuh (APIMS/Open-Meteo), pencemar utama, anggaran model, ketepatan ±N

### E. Butang "Lihat trend"

- [x] Kad butang di bawah sekali (telefon): graf mini 24 jam + "Lihat trend jam demi jam ›" → `/trend`
- [x] Ruang bawah ditambah supaya bento nasihat dan butang tidak tersorok oleh bar navigasi

### Selesai v0.5.1

- [x] Ujian unit dan E2E lulus pada CI dan production; axe tanpa pelanggaran (199 unit, 110 E2E; production 108 lulus)
- [x] Lighthouse ≥ 90 dikekalkan (production 12 Okt 2026: telefon 98/100/100/100, desktop 98/100/100/100)
- [x] Kemas kini `UJIAN-TELEFON.md`, versi 0.5.1, tag dan GitHub Release

## Fasa 14 — v0.6.0

Fokus: UI/UX yang lebih licin dan seperti aplikasi asli. Termasuk pembetulan kedudukan kad putih (v0.5.1 tambahan) dalam versi ini.
**KIV:** semakan mod gelap (dibuat selepas semua komponen siap); peta haba IPU, aliran angin, mod gambar negeri, amaran lonjakan dan amaran jerebu dijangka (v0.7.0).

### Utama

1. **Kad putih sebagai bottom sheet** (menyelesaikan isu "tolak ke atas" yang KIV)
   - [x] Dua kedudukan snap: rehat (kandungan muat di atas navigasi) dan atas (~124 px); kad melekat pada kedudukan terdekat bila dilepaskan
   - [x] Kandungan panjang ditatal di dalam kad; tarik ke bawah untuk muat semula kekal
2. **Menu lokasi pada cip lokasi** (Utama dan Trend)
   - [x] Telefon: helaian bawah; desktop: dropdown di bawah cip
   - [x] Lokasi semasa (✓), kegemaran dengan IPU mini dan warna kategori, "Guna lokasi saya", "+ Tambah bandar" → Lokasi › Senarai dengan carian kegemaran terbuka
   - [x] Tiada kegemaran: teks ringkas + "+ Tambah bandar"; boleh diguna dengan papan kekunci dan pembaca skrin
3. **Nombor IPU beranimasi** (kira naik/turun) bila bacaan berubah; tiada animasi untuk `prefers-reduced-motion` — ✅ siap (PR #66)
4. **Getaran ringan** bila tarikan mencapai ambang muat semula (Android, `navigator.vibrate`) — ✅ siap
5. **Rangka muat (skeleton)** mengikut bentuk baharu: langit, kad putih, baris angin, bento — ✅ siap

### Seluruh aplikasi

6. **Navigasi berikon Phosphor** (Utama, Trend, Lokasi, Tetapan); ikon terisi bila aktif — ✅ siap
7. **Peralihan antara skrin** (View Transitions) yang licin; dimatikan untuk `prefers-reduced-motion` — ✅ siap
8. **Skrin pembuka iOS** (splash) dengan logo awan untuk saiz iPhone/iPad biasa — ✅ siap
9. **Pengenalan ringkas pengguna baharu** (3 skrin): apa itu IPU, pilih lokasi, hidupkan amaran / pasang di iPhone; boleh dilangkau, dipaparkan sekali — ✅ siap

### Lokasi dan peta

10. **Kad stesen terpilih sebagai bottom sheet di atas peta** (seperti Google Maps) — ✅ siap
11. **Suis lapisan sebagai cip terapung di atas peta** (Titik panas, Sensor, Angin) — ✅ siap
12. **Himpunan pin (clustering)** bila dizum keluar — ✅ siap
13. **Kegemaran**: leret untuk buang, seret untuk susun semula (dengan alternatif butang untuk papan kekunci) — ✅ siap

### Amaran

14. **Butang "Hantar notifikasi ujian"** di Tetapan → Amaran (had kadar; tidak mengubah status amaran) — ✅ siap

### Selesai v0.6.0

- [x] Semakan mod gelap untuk semua komponen baharu (selepas item 1–14)
- [x] Ujian unit dan E2E lulus pada CI dan production; axe tanpa pelanggaran
- [x] Lighthouse ≥ 90 dikekalkan
- [x] Kemas kini `UJIAN-TELEFON.md`, versi 0.6.0, tag dan GitHub Release

## Fasa 15 — v0.7.0

Fokus: pengalaman pertama kali yang "nilai dahulu, ajar kemudian" (mockup: https://claude.ai/artifact/4raNnmQDKVAkgRRsJ8yZCC), kemudian ciri yang KIV sejak v0.5.1. Jika terlalu besar, bahagian C–D dipindah ke v0.8.0.

**KIV:** pautan sandaran `hezy.vercel.app` tanpa ubah hala dan pemantauan DNS dalam `pantau.yml` (laporan "server can't be found" 13 Okt; DNS disahkan sihat). Item lama: mod guru, senarai semak, BM Cina/Tamil, model ML (≥ 3 bulan data).

### A. Pengalaman pertama kali (keutamaan)

1. **Skrin alu-aluan tunggal** menggantikan pengenalan 3 langkah dan halaman alu-aluan sedia ada
   - [x] Langit Hezy sebagai latar (kecerunan statik supaya HTML pelayan tidak berkelip siang/malam); tajuk "Semak jerebu di kawasan anda"
   - [x] Butang **Guna lokasi saya** dengan nota privasi (dibundarkan ~1 km, tidak disimpan)
   - [x] **Cip 6 bandar popular** (Kuala Lumpur, Shah Alam, Johor Bahru, Pulau Pinang, Kuching, Kota Kinabalu) + carian; satu ketikan terus ke Utama
   - [x] Pengguna sedia ada (ada lokasi) terus ke Utama; pengenalan 3 langkah dan halaman alu-aluan lama dibuang
2. **Jalur "Malaysia sekarang"**: negeri tertinggi dan terendah daripada stesen APIMS, dengan masa bacaan — ✅ siap
3. **Helaian skala IPU**: ketik pil kategori (Utama, Trend) → 5 tahap dengan nasihat ringkas, tahap semasa ditanda "ANDA"
   - [x] Petunjuk sekali sahaja pada lawatan pertama ke Utama: "Apa maksud nombor ini?" (baris di bawah nombor, tidak menindih butang)
   - [x] Helaian di Utama (telefon dan desktop); Trend: KIV (bacaan Trend sebahagian daripada graf seret)
4. ✅ **Kad amaran pada saat relevan** di Utama: bila IPU > 100 atau pada lawatan kedua; "Hidupkan amaran" / "Nanti" (tidak muncul semula selama 14 hari); di iPhone digabung dengan langkah pasang
5. ✅ **Desktop dua lajur**: langit + IPU negara di kiri, pilihan lokasi di kanan; bar navigasi disembunyikan sehingga lokasi dipilih
6. **Paparan pertama lebih pantas**: skrin alu-aluan dirender dari pelayan (HTML statik); skrip kecil dalam `<head>` menentukan pengguna baharu/lama sebelum lukisan pertama (tiada kelipan) — ✅ LCP diperhati = FCP (39 ms tempatan; sebelum ini selepas JavaScript). LCP _simulasi_ Lighthouse masih 2.4–3.0 s kerana model Lantern mengira muat turun pakej React/Next (~230 KB) yang bermula sebelum LCP; < 2 s memerlukan pengurangan JavaScript awal (item berasingan)

### B. Peta

7. ✅ **Taburan IPU** (asalnya "peta haba"; di luar Malaysia daripada sensor WAQI, AQI AS → PM2.5 → IPU, bukan anggaran model): lapisan warna antara stesen (interpolasi IDW pada kanvas), cip "Peta haba", legenda, ketelusan boleh dilihat menembusi
8. ✅ **Aliran angin** (rantau Asia Tenggara 2°, peta tidak boleh dizum keluar melepasinya): zarah bergerak mengikut grid angin 850 hPa (Open-Meteo, dicache 1 jam di pelayan); `prefers-reduced-motion` → anak panah statik

### C. Amaran

9. ✅ **Amaran lonjakan**: notifikasi bila IPU naik ≥ 30 dalam 3 jam (rasmi APIMS jika ada) dan > 50, walaupun masih di bawah ambang; sekali setiap 6 jam bagi setiap lokasi, tidak semasa waktu senyap; pilihan dalam Rutin amaran (hidup secara lalai)
10. ✅ **Amaran jerebu dijangka**: notifikasi awal bila ramalan 6 jam akan datang melepasi ambang sedangkan sekarang masih di bawah (dengan jam dijangka); sekali sehari bagi setiap lokasi, tidak semasa waktu senyap; pilihan dalam Rutin amaran (hidup secara lalai)

### D. Kongsi

11. ✅ **Mod gambar negeri**: butang **Gambar** di halaman negeri → kad imej (segi empat dan Status 9:16) dengan bendera, IPU tertinggi, stesen melebihi 100 dan stesen teratas; data terus daripada APIMS di pelayan (`/kongsi/negeri`), juga sebagai pratonton pautan halaman negeri
    - [x] Bendera juga pada kad kongsi lokasi dan pratonton pautan: kawasan senarai bandar ikut negerinya; GPS ikut negeri stesen APIMS terdekat (≤ 30 km); **tiada bendera di sempadan** (stesen negeri lain < 1.5× jarak atau dalam +5 km)

### Selesai v0.7.0

- [x] Ujian unit (253) dan E2E (161, termasuk aliran pengguna baharu dan axe); semakan di Safari iOS (simulator: kad negeri, helaian kongsi iOS, bendera kad lokasi)
- [x] Lighthouse production 13 Okt 2026: telefon 97–100/100/100/100 (LCP 1.2–1.4 s; satu larian 2.6 s), desktop 100/100/100/100; susunan tajuk skrin alu-aluan dibetulkan (h2 `sr-only` di telefon)
- [x] Kemas kini `UJIAN-TELEFON.md`, versi 0.7.0, tag dan GitHub Release

## Fasa 16 — v0.7.1 (polish Utama; disahkan 14 Okt 2026)

Mulakan polish paparan satu demi satu (siri v0.8.0).

1. ✅ **Langit penuh hingga ke atas**: bar status `black-translucent` dalam mod aplikasi; bayang halus di atas langit Utama supaya jam putih jelas; jalur langit pendek (warna tahap semasa) di atas Trend, Lokasi, Tetapan dan halaman lain
2. ✅ **Nasihat pelbagai ikut keadaan**: "bersenam" → "aktiviti"; ayat dipilih ikut profil → arah IPU (naik/turun) → hujan → waktu (pagi/petang/malam); 2–3 variasi setiap keadaan, stabil ikut hari dan lokasi; BM dan EN
3. ✅ **Kad putih elastik**: tolak ke atas → melantun kembali bila kandungan muat; kekal tinggi hanya bila kandungan lebih panjang daripada skrin (lantunan di hujung); kedudukan "atas" tetap dibuang
4. ✅ **Kad sekolah padat**: satu baris dengan ikon (Backpack) dan ringkasan; ketik → helaian dengan garis panduan penuh dan penafian
   - Jangkaan **sekolah mungkin ditutup esok** berdasarkan bacaan jam 2 petang stesen terdekat: > 180, atau > 150 tiga hari berturut-turut (KPM, 8 Okt 2026); ambang dalam satu pemalar
   - Pengumpul sejarah menyimpan bacaan jam 2 petang setiap stesen
5. ✅ **Notifikasi sekolah mungkin ditutup esok** (~3 petang) bila jangkaan di atas dipenuhi

### Selesai v0.7.1

- [x] Ujian unit (263) dan E2E (165, termasuk axe); semakan Safari iOS dan mod aplikasi (simulator)
- [x] Versi 0.7.1, `UJIAN-TELEFON.md`, tag dan GitHub Release

## Fasa 17 — v0.7.2 (polish; disahkan 14 Okt 2026)

1. ✅ **Langit seragam**: kepala langit awan (warna tahap) dan kad bersudut bulat di Trend, Lokasi dan Tetapan, sama seperti Utama; jalur bar status muncul bila ditatal
2. ✅ **Helaian bersama** (`BottomSheet`): meluncur naik dan **meluncur turun** bila ditutup (X, latar, Escape), **tarik ke bawah untuk tutup**, dialog di tengah pada desktop; digunakan oleh Skala IPU, Status sekolah, Kongsi, menu lokasi dan Sumber bacaan
3. ✅ **Sumber bacaan** (ⓘ stesen) sebagai helaian, dengan penerangan bacaan rasmi berbanding anggaran model (kad Utama tidak lagi berubah saiz)
4. ✅ **Kad "Amaran dihidupkan"**: butang X dan hilang sendiri selepas 5 saat (mengecil dan memudar)
5. ✅ Versi 0.7.2, `UJIAN-TELEFON.md`, tag dan GitHub Release

**KIV (polish Trend):** kepala graf terpotong ("Rasmi A…"); legenda dan petunjuk graf diringkaskan; Ramalan 3 hari (purata besar + "puncak"); perenggan kaedah → ⓘ helaian; Sejarah 12 minggu hanya minggu berdata (min. 4); legenda sejarah sebagai jalur skala; kad Pagi/Petang/Malam tanda tempoh semasa.

## Fasa 18 — v0.7.3 (status sekolah ringkas; disahkan 14 Okt 2026)

1. ✅ Kad sekolah: › diganti ⓘ; tajuk ringkas ikut IPU (Aktiviti luar dibenarkan / dihentikan / Sekolah mungkin ditutup) dan "Semak keputusan rasmi sekolah"; tiada ambang, ramalan penutupan atau arahan "sekolah dibuka"
2. ✅ Jalan tengah: ramalan KPM (180 / 150 × 3 hari) dibuang; isyarat neutral "Bacaan tinggi berterusan · Pantau pengumuman sekolah" bila IPU jam 2 petang > 150 dua hari berturut-turut; notifikasi "IPU di … kekal tinggi — semak pengumuman sekolah untuk esok"
3. ✅ Helaian sekolah berikon (Prohibit, Warning, TrendUp, Megaphone) dan "Berdasarkan IPU rasmi … · masa"
4. ✅ Versi 0.7.3, `UJIAN-TELEFON.md`, tag dan GitHub Release

## Fasa 19 — v0.7.4 (Trend: ramalan; disahkan 15 Okt 2026)

1. ✅ Legenda graf satu baris dengan contoh bar sebenar (Lepas (rasmi) · Ramalan · Kini); "Rasmi APIMS" di kanan dibuang; petunjuk "tekan dan seret" hanya sehingga graf pertama kali disentuh; tajuk "Hari ini"
2. ✅ Tajuk "PURATA RAMALAN HARI INI" di atas Pagi/Petang/Malam
3. ✅ **Ramalan per jam**: jalur 24 jam (IPU berwarna, ikon cuaca, suhu, angin permukaan dengan arah)
4. ✅ **Ramalan harian** ala iqAir dengan togol 3 / 5 hari (purata IPU, % hujan, suhu maks/min, angin; ketik untuk puncak); menggantikan "Ramalan 3 hari"
5. ✅ Data: ramalan kualiti udara dan cuaca 5 hari; angin 10 m sejam, kebarangkalian hujan harian, angin harian
6. ✅ Versi 0.7.4, `UJIAN-TELEFON.md`, tag dan GitHub Release

## Fasa 20 — v0.7.5 (Trend kemas; disahkan 15 Okt 2026)

1. ✅ Ramalan harian: setiap hari dalam baris lutsinar sendiri; kepala lajur berikon (IPU · hujan · suhu · kelembapan · angin); kelembapan purata harian ditambah
2. ✅ Teks penerangan dibuang; ⓘ di sebelah tajuk (Hari ini, Ramalan per jam, Ramalan harian, Sejarah 12 minggu) membuka helaian berikon
3. ✅ Rangka (skeleton) untuk Ramalan per jam dan sel cuaca harian bila bacaan dalam cache belum ada data baharu; ketinggian tetap supaya tiada anjakan
4. ✅ Heatmap: kotak 18 px, warna kategori dengan keamatan ikut nilai, legenda jalur satu baris
5. ✅ Kad butiran hari: hari penuh ("Khamis"), tarikh penuh di bawah, Maks + tahap dan Purata di kanan ("jam data" dibuang)
6. ✅ Versi 0.7.5, `UJIAN-TELEFON.md`, tag dan GitHub Release

## Fasa 21 — v0.7.6 (heatmap penuh; disahkan 15 Okt 2026)

1. ✅ Heatmap Sejarah memenuhi lebar: kotak segi empat sama, saiz dikira daripada lebar sebenar (ResizeObserver) supaya grid sampai ke tepi kanan, sama lebar dengan kad hari
2. ✅ Telefon: 12 minggu (~21 px sekotak); skrin lebar: minggu ditambah hingga kotak ≤ 28 px, tajuk ikut bilangan minggu (cth. "Sejarah 20 minggu")
3. ✅ `/api/history` menghantar 182 hari (`HISTORY_FETCH_DAYS`) untuk skrin lebar
4. ✅ Versi 0.7.6, `UJIAN-TELEFON.md`, tag dan GitHub Release

## Fasa 22 — v0.7.7 (polish Lokasi; disahkan 15 Okt 2026)

Mockup: https://claude.ai/artifact/3R4rdhx2k8QwRwKkuH6zr6. Peta kekal OpenStreetMap.

1. ✅ Satu butang **Lapisan** (dengan bilangan aktif) menggantikan cip lapisan; helaian "Lapisan peta" dengan suis berikon dan keterangan sebaris; ⓘ untuk penerangan panjang
2. ✅ Teks penerangan di bawah peta dibuang; pil angin kecil dan legenda taburan di kiri bawah peta
3. ✅ Peta lebih tinggi ikut skrin; butang **skrin penuh** (✕ untuk keluar, Escape, butang kembali)
4. ✅ Muat lebih lancar: peta dan jubin dibina serentak dengan pengambilan stesen; lapisan berat (angin, titik panas) dimuat berperingkat
5. ✅ Bar navigasi terangkat di iOS 26: halaman lebih pendek daripada skrin diletakkan pada viewport kecil (100svh, tanpa bar status ~62 pt); disahkan di simulator dan dibetulkan dengan `min-h-lvh` pada `body`
6. ✅ Senarai: **Tukar** dan **+ Tambah** membuka helaian carian (satu carian pada satu masa); kegemaran dari GPS memaparkan negeri, bukan "Lokasi semasa"
7. ✅ Versi 0.7.7, `UJIAN-TELEFON.md`, tag dan GitHub Release

## Fasa 23 — v0.7.8 (Tetapan: notifikasi dan amaran; disahkan 16 Okt 2026)

Mockup: https://claude.ai/artifact/K2kQkrY8zYtUjBwb9AVE4J (papan kiri).

1. ✅ Susunan ikut kepentingan: Profil → Notifikasi → Amaran → Paparan (Tema + Bahasa) → Aplikasi → Tentang data
2. ✅ Profil kesihatan: satu baris berikon membuka helaian 4 profil (ikon + keterangan); status sekolah sebagai suis
3. ✅ **Notifikasi** diasingkan daripada **Amaran**: banner (suis), "Bila dihantar" (amaran sahaja / + ringkasan 7 pagi), waktu senyap dalam helaian, notifikasi ujian
4. ✅ **Nombor pada ikon** (pilihan `iconBadge`): IPU semasa pada ikon aplikasi; pelayan menyertakan nombor bersama setiap notifikasi; ⓘ had peranti berikon
5. ✅ Amaran diringkaskan: ambang, **Amaran awal** (gabungan jerebu dijangka 6 jam + ramalan esok), **Lonjakan mendadak**, Lokasi amaran; dimalapkan bila banner mati
6. ✅ Teks panjang ke ⓘ (ambang, tentang data, luar talian); "✓ Hezy dipasang" bila sudah dipasang
7. ✅ Padam data melalui helaian pengesahan
8. ✅ Versi 0.7.8, `UJIAN-TELEFON.md`, tag dan GitHub Release

## Fasa 24 — v0.7.9 (Tentang Hezy; disahkan 16 Okt 2026)

1. ✅ Kad Tentang Hezy: logo, nama, versi; Apa yang baharu (helaian, `src/lib/changelog.ts`, diuji sama dengan versi semasa)
2. ✅ Kongsi Hezy (helaian kongsi / salin pautan) dan Hantar maklum balas (e-mel oyendevlab@gmail.com, subjek + versi)
3. ✅ Kredit pembangun: gambar dalam bingkai bulat, "Syafiq", "Build. Create. Live"
4. ✅ Versi 0.7.9, `UJIAN-TELEFON.md`, tag dan GitHub Release

## Fasa 25 — v0.7.10 (Tetapan kemas; disahkan 16 Okt 2026)

1. ✅ Waktu senyap dan notifikasi ujian dipindah ke bawah Amaran; notifikasi ujian sebagai baris berikon
2. ✅ "Bila dihantar" → **Waktu hantaran**; tajuk + keterangan untuk Waktu hantaran dan Ambang amaran
3. ✅ Kad Tentang: Hezy / Semak Jerebu di Malaysia / Versi baris demi baris
4. ✅ Kredit pembangun lebih halus (gambar 44 px, teks kecil, tiada latar gelap)
5. ✅ Versi 0.7.10, `UJIAN-TELEFON.md`, Apa yang baharu, tag dan GitHub Release

## Fasa 26 — v0.7.11 (warna suis; disahkan 16 Okt 2026)

1. ✅ Token `--toggle`, `--pick`, `--pick-ink` (terang dan gelap): suis hidup hijau lembut, segmen terpilih hijau pucat — berbeza daripada ikon hitam
2. ✅ Diguna di Tetapan dan helaian Lapisan peta
3. ✅ Versi 0.7.11, Apa yang baharu, tag dan GitHub Release

## Fasa 27 — v0.7.12 (ikon baharu, privasi dan penafian; disahkan 16 Okt 2026)

1. ✅ Ikon baharu: kepul awan putih besar, langit biru cerah, mata memandang ke depan, senyum kecil (ikon PWA, maskable, Apple, favicon, skrin pembuka, logo dalam aplikasi, kad kongsi)
2. ✅ Skrin alu-aluan: baris "Dengan meneruskan, anda bersetuju dengan Privasi dan Penafian" → helaian berikon
3. ✅ Penafian (bukan aplikasi rasmi JAS; data boleh lewat; bukan nasihat perubatan; status sekolah panduan; budi bicara sendiri) — juga dalam kad Tentang di Tetapan
4. ✅ Versi 0.7.12, Apa yang baharu, tag dan GitHub Release

## Fasa 28 — v0.7.13 (notifikasi dan amaran digabung; disahkan 16 Okt 2026)

1. ✅ Satu bahagian "Notifikasi dan Amaran": Nombor pada ikon → Banner notifikasi → (bila banner hidup) Waktu hantaran, Ambang, Amaran awal, Lonjakan, Waktu senyap, Lokasi amaran, Notifikasi ujian
2. ✅ Notifikasi ujian: butang pil "Hantar" di kanan, status dalam keterangan
3. ✅ Padam data dipindah ke kad Tentang (bawah Privasi); helaian pengesahan berikon
4. ✅ Kredit: "Learn. Build. Repeat"
5. ✅ Versi 0.7.13, Apa yang baharu, tag dan GitHub Release

## Fasa 29 — v0.7.14 (kemas kini kecil; disahkan 16 Okt 2026)

1. ✅ Apa yang baharu: 3 keluaran terkini sahaja
2. ✅ Butang pil "Padam" di kanan baris Padam data
3. ✅ Versi 0.7.14, tag dan GitHub Release

## Fasa 30 — v0.7.15 (AM/PM dan kad kongsi; disahkan 16 Okt 2026)

1. ✅ Format masa AM/PM dalam BM dan EN (formatHour/formatClock/formatWindow, paksi graf, julat Pagi/Petang/Malam, notifikasi)
2. ✅ Kad kongsi: Hezy tebal; masa dijana (`d`, formatStamp) di kanan atas; bendera sejajar atas nombor; IPU → tahap → APIMS (JAS) → Bacaan …; nama negeri di bawah lokasi
3. ✅ Graf kad: "Bacaan IPU per jam", legenda Rasmi/Ramalan/Kini, garis putus jam semasa
4. ✅ Fon Plus Jakarta Sans (OFL) untuk imej next/og (`public/fonts`, `og-fonts.ts`) — huruf tebal kini dirender
5. ✅ Versi 0.7.15, Apa yang baharu, tag dan GitHub Release

## Fasa 31 — v0.8.0 (siri polish paparan siap; 16 Okt 2026)

Penanda siri polish v0.7.1–v0.7.15:

- **Utama** (0.7.1–0.7.3): langit penuh hingga bar status, ayat nasihat ikut konteks, kad elastik, helaian bersama, status sekolah ringkas
- **Trend** (0.7.4–0.7.6): ramalan per jam dan harian, ⓘ, rangka muat, heatmap penuh
- **Lokasi** (0.7.7): butang Lapisan, skrin penuh, helaian carian, bar navigasi iOS
- **Tetapan** (0.7.8–0.7.14): notifikasi dan amaran, nombor pada ikon, kad Tentang, kredit, penafian, warna suis
- **Identiti** (0.7.12, 0.7.15): ikon awan baharu, AM/PM, kad kongsi baharu dengan fon Plus Jakarta Sans

1. ✅ Versi 0.8.0, Apa yang baharu, tag dan GitHub Release
2. ⬜ Ujian telefon penuh (`UJIAN-TELEFON.md` v0.7.1–v0.7.15) oleh pengguna; pembetulan sebagai 0.8.x

## Fasa 32 — v0.8.1 (keselamatan; 16 Okt 2026)

Audit siri 0.8.x (data, logik, stabil, laju, keselamatan) — laporan penuh dan pelan v0.8.2–v0.9.0: [AUDIT-0.8.md](AUDIT-0.8.md)

1. ✅ Next.js 16.4.0 → 16.4.2 dan React 19.3.1: tampalan GHSA-673q-mjm6-r5xr (RCE `use cache`), GHSA-2464-fhr4-w9xw (RCE pengoptimum imej SVG), GHSA-p3m5-59mp-jv5r (DoS Server Actions)
2. ✅ Langganan push hanya untuk perkhidmatan push pelayar (FCM, Apple, Mozilla, WNS) — tutup SSRF melalui endpoint sebarangan; rekod lama yang tidak sah dibuang oleh `/api/push/check`
3. ✅ Rahsia cron dibandingkan dalam masa tetap (`request-guard.ts`); permintaan rentas laman ke `/api/log` dan `/api/push/*` ditolak; had saiz badan dan had kadar langganan
4. ✅ Pengepala: CSP (tanpa nonce, halaman kekal statik), X-Frame-Options, HSTS `includeSubDomains`, Permissions-Policy, COOP; `X-Powered-By` dibuang
5. ✅ GitHub Actions dengan kebenaran minimum; Dependabot mingguan (npm berkumpulan) dan bulanan (actions)
6. ✅ Versi 0.8.1, Apa yang baharu, tag dan GitHub Release

## Fasa 33 — v0.8.2 (laju dan stabil; 16 Okt 2026)

Punca: selepas deployment v0.8.1, cache miss `/api/aqi` mengambil ~10 s kerana cuaca Open-Meteo tamat masa (8 s) dan `/api/aqi` menunggu cuaca sebelum memuat bacaan IPU; `use cache` lalai hanya dalam memori setiap instans.

1. ✅ Rantau fungsi `sin1` (`vercel.json`) — sama dengan pengguna, APIMS dan stor Blob `hezy-push`
2. ✅ `/api/aqi`: semua sumber dimulakan serentak; cuaca, titik panas dan ketepatan ditunggu ≤ 2.5 s, sejarah APIMS ≤ 3 s (`budget.ts`); yang lambat dibiar siap dengan `after()` untuk mengisi cache; respons separa dicache 60 s (bukan 5 min) dan ditanda `partial`
3. ✅ Klien mengambil semula bacaan separa selepas 75 s bila tab aktif
4. ✅ Model dan cuaca ikut sel 0.1° (grid Open-Meteo) supaya cache dikongsi; model disegarkan setiap jam, disimpan 6 jam (CAMS dikemas kini 2×/hari)
5. ✅ Sandaran: siri model terakhir yang berjaya (≤ 24 jam) bila Open-Meteo gagal; had masa 10 s untuk Open-Meteo kualiti udara (sebelum ini tiada); FIRMS dua satelit serentak
6. ✅ `@vercel/speed-insights` dipasang (Core Web Vitals pengguna sebenar)
7. ✅ Versi 0.8.2, Apa yang baharu, tag dan GitHub Release

## Fasa 34 — v0.8.3 (model ramalan E dalam mod bayang, kad harian unit JAS; 16 Okt 2026)

Rujukan: [AUDIT-0.8.md](AUDIT-0.8.md) §2 (backtest: E mengurangkan ralat 24–61% berbanding v0.8.0).

1. ✅ `forecast-jas.ts`: model E — offset supaya purata 24 j model = IPU rasmi terakhir, ramalan sebagai purata bergerak 24 j (unit JAS), dicampur bacaan rasmi terakhir dengan berat e^(−jam/12); tanpa stesen → purata 24 j model mentah
2. ✅ Mod bayang: `/api/accuracy/run` simpan ramalan E (`jas`) bersama model asal dan v0.8.0 dalam snapshot malam; ralat `fj` dikira keesokan harinya
3. ✅ `/api/accuracy` memaparkan `forecastJas` (MAE model E) untuk dibanding dengan `forecast` (v0.8.0)
4. ✅ Kad Ramalan harian dan baris "Hari ini" dalam unit JAS (purata 24 j) menggunakan siri E — purata 24 j daripada pembetulan lama tidak sah kerana jam lepas dalam tetingkap belum dibetulkan; amaran ramalan esok ikut nilai yang sama. Graf, jalur per jam dan masa terbaik kekal kaedah v0.8.0 (dibanding dalam mod bayang)
5. ✅ Terjemahan EN "Apa yang baharu" v0.8.1–v0.8.3 (terlepas dalam v0.8.1/v0.8.2) + ujian supaya 3 keluaran terkini sentiasa diterjemah
6. ✅ Ujian unit model E, mod bayang, kad harian dan `dayIpu` (294 lulus); E2E 186 lulus; data sebenar KL: esok 142 (dahulu 105) dengan rasmi semasa 155
7. ✅ Versi 0.8.3, Apa yang baharu, tag dan GitHub Release
8. ✅ `ketepatan.yml` dijalankan selepas deployment: snapshot 17 Okt mengandungi model E untuk 68/68 stesen (cth. Cheras v0.8.0 150→95→90→121, model E 154→152→139→124); penilaian pertama selepas 17 Okt berlalu
9. ⬜ Keluaran berasingan (selepas ≥ 7 hari data bayang, iaitu ~24 Okt): tukar graf, jalur per jam dan masa terbaik ke model E jika `forecastJas` < `forecast` (v0.8.4 digunakan untuk kestabilan jadual, Fasa 35)

## Fasa 35 — v0.8.4 (kestabilan jadual, pilihan percuma; 16 Okt 2026)

Penemuan 16 Okt 2026: GitHub Actions menggugurkan dan melewatkan larian berjadual. `push-check.yml` (setiap jam) hanya berjalan 25 kali dalam 117 jam (~21%, kira-kira setiap 4–6 jam, lewat 1–59 min); `ketepatan.yml` (20:50 MYT) berjalan 01:00–05:30 pagi; `sejarah.yml` (setiap 3 jam) ~4 kali sehari. Amaran IPU boleh lewat beberapa jam. Pengguna memilih pilihan percuma (bukan penjadual luar atau Vercel Pro).

1. ✅ Vercel Cron (Hobby: sekali sehari setiap cron, ±59 min, `CRON_SECRET` dihantar automatik) dalam `vercel.json`: ketepatan malam (20:00–20:59 MYT), sejarah semalam lengkap (00:00–00:59 MYT), dan semakan amaran pada tiga tetingkap notifikasi harian — ringkasan pagi (07:xx), status sekolah (15:xx), ramalan esok (20:xx)
2. ✅ `push-check.yml` empat kali sejam pada minit ganjil (:07, :22, :37, :52) dengan `concurrency` supaya larian tidak bertindih; logik amaran sedia ada berasaskan keadaan, jadi tiada notifikasi berganda
3. ✅ `ketepatan.yml` menjadi sandaran: `/api/accuracy/run?ifStale=20` dilangkau jika indeks sudah dikemas kini dalam 20 jam (larian manual tetap paksa)
4. ✅ `scripts/monitor.mjs` (pantau harian): kira larian `push-check.yml` 24 jam lepas melalui API GitHub dan gagal (buka issue) bila jurang terbesar lebih 2 jam (diuji tempatan: 5 larian dalam 24 jam, jurang 5.8 jam → gagal); log ketepatan turut memaparkan model E (bayang)
5. ✅ Ujian (294 unit, 186 E2E), versi 0.8.4, Apa yang baharu (dengan terjemahan EN), tag dan GitHub Release
6. ✅ Selepas deployment: 5 cron Vercel didaftarkan pada URL deployment (bukan alias `hezy.vercel.app` yang mengubah hala), query `?back=1` dikekalkan; ujian `vercel crons run /api/history/collect?back=1` → 200 (melepasi perlindungan deployment, `CRON_SECRET` sah)
7. ⬜ Semak 17 Okt: bilangan larian `push-check.yml` dan jurang terbesar dalam 24 jam (laporan `pantau.yml`), serta larian cron Vercel pertama dalam log
8. ⬜ Jika jurang masih > 2 jam selepas seminggu: pertimbangkan penjadual luar (cron-job.org/QStash) atau Vercel Pro

## Fasa 36 — v0.8.5 (anggaran kawasan tanpa stesen, cache ikut jadual APIMS; 16 Okt 2026)

Kerja malam 16–17 Okt 2026 (dipersetujui pengguna). Rujukan: [AUDIT-0.8.md](AUDIT-0.8.md) D1, D2 (backtest tinggal-satu-keluar: ralat 26–42 → 10–18 IPU).

1. ✅ `spatial-bias.ts`: bias PM2.5 setiap stesen (IPU rasmi ≤ 3 jam vs purata 24 jam model di lokasi stesen), purata berwajaran jarak (IDW, ≤ 5 stesen dalam 150 km, w = 1/d²), pudar ke 0 pada 200 km
2. ✅ `getStationModels()`: model di lokasi 68 stesen (3 permintaan berbilang lokasi serentak, cache 1 jam)
3. ✅ `loadReading`: bila tiada bacaan rasmi dalam 30 km, siri model dibetulkan dengan bias IDW sebelum bacaan dibina — nombor utama, graf, jalur per jam dan ramalan harian konsisten; had masa sama seperti sejarah APIMS
4. ✅ UI: label anggaran "dibetulkan dengan N stesen berdekatan" (BM/EN)
5. ✅ Ketepatan malam: ralat anggaran IDW tinggal-satu-keluar (`es`) untuk 7 hari lepas; `/api/accuracy` → `estimateSpatial`
6. ✅ Cache stesen ikut jadual APIMS: semak setiap 2 minit bila jam semasa belum diterbitkan, jika tidak hingga ~8 minit selepas jam berikutnya; CDN `/api/stations` ikut
7. ✅ Ujian (303 unit, E2E), versi 0.8.5, Apa yang baharu (BM/EN), tag dan GitHub Release; data sebenar: Mersing 54 → 92 (Rompin 72 km, IPU 94), Kuala Lipis 60 → 81, Lawas 34 → 53
8. ✅ Jalankan `ketepatan.yml` selepas deployment supaya `estimateSpatial` dikira (ralat IDW 7 hari lepas) — hasil: **17 IPU** berbanding 36 untuk model mentah (−53%)

## Fasa 37 — v0.8.6 (MetMalaysia dan proksi WAQI; 16 Okt 2026)

1. ✅ `metmalaysia.ts`: amaran (`/weather/warning`) dan ramalan 7 hari (`/weather/forecast`) daripada api.data.gov.my, disahkan bentuknya, dicache (amaran ~15 min, ramalan ~1 jam)
2. ✅ Padanan negeri pengguna (stesen APIMS terdekat dalam 150 km) dengan bahagian negeri dalam teks amaran (dipecah "•", dengan daerah) dan ramalan peringkat negeri (`?contains=St@location__location_id`, 40 KB)
3. ✅ Kad amaran cuaca rasmi di Utama bila lokasi terlibat (dalam app sahaja, tiada notifikasi push baharu); ramalan rasmi MetMalaysia dalam Trend; sumber dalam kredit
4. ✅ Proksi WAQI: `/api/waqi?scope=malaysia|region` di pelayan, **tanpa sebarang cache** (terma WAQI: "The data can not be redistributed as cached or archived data"), hanya dua kotak tetap, tolak rentas laman, had kadar; token tidak lagi dalam bundle pelayar dan WAQI tidak melihat IP pengguna; CSP `connect-src 'self'` sahaja; teks privasi dikemas kini
5. ✅ Ujian (unit: penghurai dan padanan MetMalaysia dengan format sebenar; E2E: kad amaran, ramalan Trend, proksi WAQI), versi 0.8.6, Apa yang baharu (BM/EN), tag dan GitHub Release
