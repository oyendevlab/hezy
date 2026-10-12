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

- [ ] Label "IPU" di atas nombor; penanda sumber ("Rasmi · APIMS" / "Anggaran")
- [ ] Ikon cuaca semasa + suhu di sebelah kanan (cth. "31° Berawan"); siang/malam
- [ ] Ikon garisan pada bento nasihat (topeng, tingkap, air, dll.) — dilukis sendiri dahulu; tukar ke set ikon sedia ada jika kurang sesuai

### C. Trend

- [ ] Pengepala: nombor IPU dan pil sebaris dan sejajar; lokasi sebagai cip (📍 lokasi ⌄) ke tab Lokasi
- [ ] Graf: tekan dan seret untuk melihat jam lain; lepas → kembali ke jam semasa (butang "Kembali" dibuang); tetikus keluar / fokus beralih → kembali
- [ ] Baris bacaan tinggi tetap (masa | nombor + pil | sumber) supaya tidak melompat semasa diseret
- [ ] Ikon kecil pada bento Pagi/Petang/Malam dan ikon cuaca harian pada Ramalan 3 hari

### D. Lokasi

- [ ] Tab **Peta | Senarai**; Peta dipaparkan dahulu
- [ ] Kegemaran yang sama dengan lokasi semasa ditanda "semasa" (tidak diulang)

### 1. Banner pasang Hezy (iPhone/iPad)

- [ ] Di Utama untuk Safari yang belum memasang Hezy: "Pasang Hezy untuk amaran dan akses pantas" → panduan 4 langkah; boleh ditutup (tidak muncul semula 14 hari)

### 8. Halaman Privasi

- [ ] `/privasi` (BM/EN): lokasi dan tetapan hanya di peranti; langganan notifikasi (lokasi dibundarkan ~1 km) sehingga amaran dimatikan; log ralat tanpa data peribadi 14 hari; Vercel Web Analytics tanpa kuki; sumber data pihak ketiga (APIMS, Open-Meteo, NASA FIRMS, WAQI); cara padam data
- [ ] Pautan dari Tetapan dan kaki halaman

### 9. Halaman negeri dan kongsi dalam English

- [ ] Halaman `/negeri`, `/negeri/[negeri]` dan `/kongsi` mengikut bahasa pengguna (BM/EN); metadata kekal BM untuk SEO

### Selesai v0.5.0

- [ ] Semua ujian unit dan E2E lulus pada CI dan production (`hezy.my`); axe tanpa pelanggaran
- [ ] Lighthouse ≥ 90 dikekalkan dengan langit WebGL
- [ ] Kemas kini `UJIAN-TELEFON.md`, versi 0.5.0, tag dan GitHub Release
