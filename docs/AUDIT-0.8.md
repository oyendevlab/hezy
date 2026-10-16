# Audit siri 0.8.x — data, logik, stabil, laju, keselamatan

Tarikh: 16 Okt 2026 · Versi diaudit: v0.8.0 · Keluaran pembetulan: v0.8.1 (keselamatan)

## Penilaian ringkas

| Aspek                      | Skor (/10) | Ringkasan                                                                                                   |
| -------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| Data (ketepatan/kesegaran) | 6          | APIMS rasmi dan segar (lewat ~1 jam dari JAS); model CAMS kurang anggar jerebu ~35 IPU                      |
| Model ramalan              | 4          | Kalah dengan "kekalkan bacaan rasmi terakhir" pada semua tempoh; kaedah baharu diuji −24% hingga −61% ralat |
| Kelajuan                   | 8          | Lighthouse mudah alih 94; CDN ~100 ms; cache miss `/api/aqi` ~2 s (fungsi di AS)                            |
| Kestabilan                 | 7          | Cache peranti + CDN baik; bergantung pada kuota percuma Open-Meteo, tiada sandaran bila gagal               |
| Keselamatan                | 5 → 8      | RCE kritikal Next.js dan SSRF push dibetulkan dalam v0.8.1                                                  |

## 1. Data

### Status sekarang

- **APIMS (JAS)** — sumber rasmi, dikemas kini setiap jam. Pada 20:03 data terkini ialah jam 19:00 (JAS sendiri lewat ~1 jam). Hezy menambah sehingga ~15–30 min lagi melalui cache (pelayan 15 min, CDN 5 min + SWR, peranti 10 min).
- **Open-Meteo (CAMS global)** — grid ~40 km, dikemas kini dua kali sehari. Backtest 7 hari, 68 stesen: bias **−35 IPU**, kategori betul hanya 56–63%. Contoh 16 Okt 20:00, Cheras: rasmi **157 Tidak Sihat**, model **87 Sederhana**.
- **Kawasan > 30 km dari stesen** — Hezy memaparkan model mentah (ralat purata 26–42 IPU).
- **Cuaca** — Open-Meteo (model global), tiada amaran rasmi.
- **MetMalaysia** (`api.data.gov.my/weather/forecast`, `/weather/warning`) — percuma, tanpa kunci: ramalan 7 hari ikut daerah dan amaran rasmi (cth. Amaran Ribut Petir dikeluarkan 17:55, 16 Okt).

### Cadangan

| #   | Cadangan                                                                                                 | Kesan                                                   |
| --- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| D1  | Anggaran kawasan tanpa stesen: model + pembetulan bias daripada stesen berdekatan (IDW)                  | Ralat 26–42 → 10–18 IPU; kategori betul 60–67% → 83–87% |
| D2  | Cache stesen ikut jadual APIMS (semak setiap 5 min sekitar masa terbit), papar "dikemas kini X min lalu" | Kelewatan tambahan ~15–30 min → < 5–10 min              |
| D3  | Amaran dan ramalan rasmi MetMalaysia (ribut petir, hujan lebat) di Utama dan notifikasi                  | Sumber rasmi tempatan, bukan model global sahaja        |
| D4  | Proksi WAQI melalui pelayan (cache 10 min)                                                               | Token tidak terdedah, satu permintaan dikongsi semua    |

## 2. Model ramalan

### Punca ralat

Pembetulan v0.8.0 membandingkan IPU rasmi (purata PM2.5 **24 jam**) dengan PM2.5 **sejam** model, kemudian meramal IPU sejam. Ramalan tidak sama unit dengan nombor rasmi: ia turun naik mengikut kitaran harian (cth. 157 → 110 dalam 9 jam) sedangkan IPU rasmi berubah perlahan. Selepas 48 jam ramalan kembali kepada model mentah yang bias −35.

### Backtest (7 hari, 68 stesen, ~3,000 titik asas; MAE dalam unit IPU / % kategori betul)

| Kaedah                              | 1–6 j         | 7–24 j         | 25–48 j        | 49–72 j        |
| ----------------------------------- | ------------- | -------------- | -------------- | -------------- |
| Model mentah (purata 24 j)          | 36.6 / 63%    | 36.2 / 62%     | 35.9 / 62%     | 36.6 / 64%     |
| **Hezy v0.8.0**                     | 10.6 / 90%    | 24.3 / 76%     | 32.7 / 67%     | 39.3 / 59%     |
| Kekalkan bacaan rasmi terakhir      | 4.2 / 96%     | 16.0 / 84%     | 27.7 / 73%     | 33.3 / 69%     |
| **Cadangan E**                      | **4.1 / 96%** | **15.4 / 84%** | **24.2 / 80%** | **29.8 / 75%** |
| Pengurangan ralat berbanding v0.8.0 | −61%          | −37%           | −26%           | −24%           |

**Cadangan E:** (1) offset supaya purata 24 jam model sama dengan IPU rasmi terakhir; (2) ramal IPU sebagai purata bergerak 24 jam (unit JAS) — ramalan bermula tepat pada nombor rasmi dan berubah lancar; (3) campur dengan bacaan rasmi terakhir, berat e^(−jam/12). Offset reput ke 0 dalam 72 jam pada asalnya; sejak v0.8.8 dalam 168 jam (backtest: hari ke-3–5 MAE 25–30 berbanding 30–43).

Kaveat: data model lepas ialah analisis terbaik Open-Meteo (bukan ramalan sebenar pada masa itu) dan minggu ini musim jerebu. Oleh itu kaedah baharu dijalankan dahulu dalam **mod bayang** (disimpan bersama ramalan lama dalam saluran ketepatan malam sedia ada) selama 7–14 hari sebelum ditukar.

### Cadangan

| #   | Cadangan                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------- |
| M1  | Laksana Cadangan E dalam `forecast-correction.ts` / `reading.ts`, dengan ujian unit                   |
| M2  | Mod bayang: `accuracy/run` simpan ramalan lama + baharu, `/api/accuracy` banding MAE                  |
| M3  | Kad harian: "IPU dijangka" ialah IPU purata 24 j (unit JAS), bukan maksimum IPU sejam (cth. 207)      |
| M4  | Papar julat ketidakpastian (±MAE) dan label "kurang pasti" untuk hari ke-3/4                          |
| M5  | Selepas ≥ 30 hari data: bias per stesen ikut jam dan tempoh (MOS); ML selepas ≥ 3 bulan (item 16 KIV) |

## 3. Kelajuan dan kestabilan

### Ukuran (16 Okt 2026)

- Lighthouse mudah alih (4G perlahan disimulasi): **Prestasi 94**, Kebolehcapaian 100, Amalan terbaik 100, SEO 100
  - Utama: FCP 0.9 s, LCP 2.7 s, TBT 70 ms, CLS 0 · Trend: LCP 3.0 s, TBT 120 ms
- HTML dari CDN: TTFB ~100 ms (HIT)
- `/api/aqi`: CDN HIT ~100 ms; **MISS ~2.0 s**
- JS halaman Utama ~250 KB gzip (~750 KB dinyahmampat); JS tidak digunakan ~48 KB, JS lama (polyfill) ~14 KB
- Pengguna berulang melihat bacaan serta-merta dari cache peranti

### Punca kelambatan / risiko

1. **Fungsi Vercel di `iad1` (Washington DC)** sedangkan pengguna, APIMS dan stor Blob `hezy-push` di **sin1 (Singapura)** — setiap cache miss dan setiap bacaan Blob merentas Pasifik.
2. Panggilan bersiri dalam `/api/aqi`: Open-Meteo → sejarah APIMS → titik panas → indeks ketepatan.
3. Kunci cache model per 0.01° (~1 km) walaupun grid CAMS ~40 km → kadar hit rendah; kuota percuma Open-Meteo (10,000 panggilan/hari) boleh habis bila tular atau diserang → 502 untuk semua.
4. Tiada sandaran bila Open-Meteo/APIMS gagal (502 terus).
5. Speed Insights diaktifkan di papan pemuka tetapi pakej `@vercel/speed-insights` belum dipasang (tiada data pengguna sebenar).

### Cadangan

| #   | Cadangan                                                                                                    | Kesan dijangka                             |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| S1  | Rantau fungsi `sin1` (`vercel.json` `regions`)                                                              | Cache miss −0.5 hingga −1 s; Blob tempatan |
| S2  | Panggilan selari dalam `/api/aqi` dan `loadReading`                                                         | −0.3 hingga −0.8 s pada cache miss         |
| S3  | Bundar koordinat model ke 0.1° di pelayan                                                                   | Hit cache naik, panggilan Open-Meteo turun |
| S4  | Pra-panas: cron setiap jam ambil model 68 stesen (3 panggilan berbilang lokasi) ke Blob; turut menyokong D1 | `/api/aqi` jarang memanggil Open-Meteo     |
| S5  | Sandaran "stale-if-error": nilai terakhir yang baik dari Blob bila sumber gagal                             | Tiada 502 semasa gangguan sumber           |
| S6  | Pasang `@vercel/speed-insights`                                                                             | Core Web Vitals pengguna sebenar           |
| S7  | Muat malas komponen bukan paparan pertama; semak `browserslist` untuk buang polyfill                        | −40 hingga −60 KB JS                       |

## 4. Keselamatan

### Dibetulkan dalam v0.8.1

| Tahap     | Isu                                                                                                                        | Pembetulan                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Kritikal  | Next.js 16.4.0: RCE dalam `use cache` (GHSA-673q-mjm6-r5xr), RCE imej SVG (GHSA-2464-fhr4-w9xw), DoS (GHSA-p3m5-59mp-jv5r) | Next 16.4.2, React 19.3.1                            |
| Tinggi    | SSRF: endpoint push sebarang `https://` → pelayan menghantar POST ke URL penyerang setiap jam                              | Hanya FCM/Apple/Mozilla/WNS; rekod tidak sah dibuang |
| Sederhana | Tiada CSP / anti-bingkai (clickjacking)                                                                                    | CSP, X-Frame-Options, HSTS, Permissions-Policy, COOP |
| Sederhana | Rahsia cron dibanding dengan `!==`                                                                                         | Perbandingan masa tetap                              |
| Sederhana | POST rentas laman, badan tanpa had, tiada had kadar langganan                                                              | Tolak rentas laman, had saiz, 20/min setiap instans  |
| Rendah    | `X-Powered-By`, workflow tanpa `permissions`, tiada Dependabot                                                             | Dibuang / kebenaran minimum / Dependabot             |

### Perlu tindakan anda (tetapan akaun)

1. **Vercel Firewall** — peraturan had kadar untuk `/api/*` (papan pemuka → Firewall).
2. **`BLOB_READ_WRITE_TOKEN`** turut tersedia untuk Preview dan Development → deployment preview boleh menulis ke data production. Cadangan: buang daripada Preview/Development atau guna stor Blob berasingan.
3. **GitHub** — hidupkan Dependabot alerts + security updates; lindungi cabang `main` (wajib CI lulus).
4. **Kad kongsi boleh dipalsukan** (sesiapa boleh membina pautan `/kongsi?i=480&s=apims`). Cadangan: label "dikongsi pada … · semak bacaan terkini" + bacaan langsung di halaman kongsi.

## 5. Vercel dan domain

| Perkara                         | Status                                                           |
| ------------------------------- | ---------------------------------------------------------------- |
| hezy.my                         | ✅ disahkan, SSL, `misconfigured: false`                         |
| www.hezy.my, hezy.vercel.app    | ✅ ubah hala 308 ke hezy.my                                      |
| Rekod DNS (Hostinger)           | ⚠️ Vercel cadangkan kemas kini (`optional-change`) — lihat bawah |
| Node.js                         | ✅ 24.x, Fluid Compute                                           |
| Perlindungan deployment preview | ✅ SSO (kecuali domain tersuai), perlindungan fork               |
| Pembolehubah persekitaran       | ✅ rahsia jenis "sensitive" (kecuali `BLOB_READ_WRITE_TOKEN`)    |
| Rantau fungsi                   | ⚠️ `iad1` — cadang `sin1`                                        |
| Speed Insights                  | ⚠️ diaktifkan tetapi tiada data (pakej belum dipasang)           |
| Vercel CLI tempatan             | ⚠️ 54.6.1 → 64.3.1 (`npm i -g vercel@latest`)                    |

**Kemas kini DNS di Hostinger** (rekod lama 76.76.21.21 masih berfungsi; ini cadangan rangkaian baharu Vercel):

| Jenis | Nama | Nilai sekarang | Nilai baharu                                  |
| ----- | ---- | -------------- | --------------------------------------------- |
| A     | @    | 76.76.21.21    | 216.198.79.1 **dan** 64.29.17.1 (dua rekod A) |
| CNAME | www  | hezy.my        | 2b0cfc51ff45fcaf.vercel-dns-017.com           |

## 6. Pelan keluaran dicadangkan

| Versi  | Fokus                                                                                           |
| ------ | ----------------------------------------------------------------------------------------------- |
| v0.8.1 | ✅ Keselamatan                                                                                  |
| v0.8.2 | ✅ Laju & stabil: S1–S3, S5, S6                                                                 |
| v0.8.3 | ✅ Model ramalan E dalam mod bayang (M1, M2) + kad harian unit JAS (M3)                         |
| v0.8.4 | Kestabilan jadual (Fasa 35): Vercel Cron harian, GitHub kerap, pemantauan jurang amaran         |
| v0.8.5 | Tukar graf dan jalur per jam ke model E selepas ≥ 7 hari data bayang; julat ketidakpastian (M4) |
| v0.8.6 | Anggaran kawasan tanpa stesen (D1) + pra-panas (S4), cache ikut jadual APIMS (D2)               |
| v0.8.7 | MetMalaysia: amaran dan ramalan rasmi (D3), proksi WAQI (D4)                                    |
| v0.9.0 | Penanda siri data & logik siap                                                                  |
