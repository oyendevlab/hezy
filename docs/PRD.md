# PRD: Hezy — Semak Jerebu

|                   |                    |
| ----------------- | ------------------ |
| **Produk**        | Hezy (PWA)         |
| **Versi dokumen** | 0.1 (draf)         |
| **Tarikh**        | 11 Oktober 2026    |
| **Status**        | Draf untuk semakan |

---

## 1. Ringkasan

Hezy ialah aplikasi web progresif (PWA) untuk menyemak Indeks Pencemar Udara (IPU) semasa di Malaysia dengan cepat. Pengguna buka aplikasi, terus nampak tahap jerebu di lokasi mereka dan tahu apa yang perlu dibuat. Aplikasi ini tidak memerlukan login, ringan dan boleh dipasang di skrin utama.

## 2. Masalah

- Laman rasmi APIMS sukar dibaca di telefon dan tidak memberi nasihat yang jelas.
- Ibu bapa, pesakit asma dan orang yang aktif di luar perlu tahu dengan cepat sama ada selamat untuk keluar.
- Semasa musim jerebu, orang menyemak beberapa kali sehari, jadi setiap semakan perlu siap dalam masa kurang daripada 5 saat.

## 3. Matlamat

| Matlamat         | Ukuran kejayaan                                                                        |
| ---------------- | -------------------------------------------------------------------------------------- |
| Semakan pantas   | Masa dari buka aplikasi hingga IPU dipaparkan kurang daripada 2 saat (4G, cache panas) |
| Mudah difahami   | 90% pengguna ujian faham tahap bahaya tanpa membaca nombor                             |
| Kerap digunakan  | 30% pengguna memasang PWA di skrin utama                                               |
| Boleh dipercayai | Setiap bacaan memaparkan masa kemas kini dan sumber data                               |

### Bukan matlamat (v1)

- Akaun atau login pengguna
- Laporan jerebu daripada pengguna (perlu moderasi)
- Chatbot AI
- Sejarah data lebih daripada 7 hari

## 4. Pengguna sasaran

| Persona                                  | Keperluan utama                                                            |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| **Ibu bapa**                             | Tahu sama ada anak boleh main di luar dan sama ada sekolah mungkin ditutup |
| **Pesakit asma atau penyakit paru-paru** | Amaran awal dan nasihat khusus                                             |
| **Pelari atau penunggang basikal**       | Masa terbaik untuk bersenam di luar                                        |
| **Pekerja luar** (rider, pekerja binaan) | Jawapan ringkas sama ada perlu pakai topeng                                |

## 5. Skop ciri

### 5.1 Teras (MVP, P0)

| #   | Ciri                           | Penerangan                                                                                                         | Kriteria penerimaan                                                                                          |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| F1  | **IPU semasa ikut lokasi**     | Cari stesen terdekat melalui GPS. Pengguna boleh pilih negeri dan kawasan secara manual jika menolak akses lokasi. | Nombor IPU, label kategori dan warna dipaparkan. Pemilihan manual berfungsi tanpa GPS.                       |
| F2  | **Nasihat kesihatan**          | Nasihat ringkas ikut kategori IPU, dengan tab Umum, Kanak-kanak, Warga Emas dan Asma.                              | Setiap kategori ada 2–4 nasihat. Tab profil yang dipilih diingati dalam `localStorage`.                      |
| F3  | **Lokasi kegemaran**           | Simpan sehingga 5 lokasi (contohnya Rumah, Pejabat dan Sekolah).                                                   | Lokasi disimpan dalam `localStorage`, kekal selepas aplikasi ditutup, dan boleh disusun semula atau dipadam. |
| F4  | **Trend 24 jam**               | Graf bacaan setiap jam bersama penunjuk arah naik, turun atau stabil.                                              | Graf memaparkan 24 titik. Arah dikira berdasarkan perubahan dalam 3 jam terakhir.                            |
| F5  | **Masa kemas kini dan sumber** | Contohnya "Dikemas kini 10:00 pagi · Sumber: APIMS".                                                               | Sentiasa dipaparkan di bawah nombor IPU.                                                                     |

### 5.2 PWA (P0)

| #   | Ciri                    | Kriteria penerimaan                                                                                                        |
| --- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| F6  | **Boleh dipasang**      | Ada `manifest.json` serta ikon 192 px, 512 px dan maskable. Lulus semakan Lighthouse PWA.                                  |
| F7  | **Mod luar talian**     | Service worker menyimpan bacaan terakhir. Ketika luar talian, banner "Luar talian · Data terakhir: X jam lalu" dipaparkan. |
| F8  | **Mod gelap dan cerah** | Ikut `prefers-color-scheme` secara lalai. Pengguna boleh menukar tema secara manual.                                       |

### 5.3 Tambahan (P1, selepas MVP)

| #   | Ciri                            | Nota                                                                                           |
| --- | ------------------------------- | ---------------------------------------------------------------------------------------------- |
| F9  | **Ramalan 3 hari**              | PM2.5 daripada Open-Meteo ditukar kepada anggaran IPU dan dilabel "Anggaran".                  |
| F10 | **Peta stesen**                 | Peta Leaflet dengan pin berwarna ikut IPU.                                                     |
| F11 | **Panduan status sekolah**      | Ikut garis panduan KPM. Ambang perlu disahkan sebelum dilancarkan.                             |
| F12 | **Kongsi status**               | Web Share dengan teks "IPU Shah Alam: 156 (Tidak Sihat) · via Hezy".                           |
| F13 | **Notifikasi IPU melebihi 100** | Web Push memerlukan backend kecil. Di iOS, notifikasi hanya berfungsi jika PWA sudah dipasang. |

## 6. Kategori IPU (rujukan JAS)

| Julat        | Kategori           | Warna  | Nasihat ringkas (umum)                              |
| ------------ | ------------------ | ------ | --------------------------------------------------- |
| 0–50         | Baik               | Biru   | Aktiviti seperti biasa                              |
| 51–100       | Sederhana          | Hijau  | Kumpulan sensitif perlu kurangkan aktiviti berat    |
| 101–200      | Tidak Sihat        | Kuning | Kurangkan aktiviti luar dan pakai topeng            |
| 201–300      | Sangat Tidak Sihat | Oren   | Elak aktiviti luar dan tutup tingkap                |
| Melebihi 300 | Berbahaya          | Merah  | Kekal di dalam rumah dan ikut arahan pihak berkuasa |

## 7. Data dan seni bina

### Sumber data

| Sumber                     | Peranan                | Nota                                                                    |
| -------------------------- | ---------------------- | ----------------------------------------------------------------------- |
| **Open-Meteo Air Quality** | Sumber MVP dan ramalan | Percuma tanpa kunci API, tetapi datanya ialah data model                |
| **APIMS (JAS)**            | Bacaan rasmi (fasa 2)  | Tiada API awam rasmi, jadi perlu proksi di sisi pelayan                 |
| **WAQI**                   | Sandaran               | Perlu token dan menggunakan skala AQI AS, jadi perlu ditukar kepada IPU |

### Stack cadangan

- **Frontend:** Next.js (App Router) atau Vite + React, dengan Tailwind CSS
- **Graf:** Recharts
- **PWA:** Serwist atau `vite-plugin-pwa`
- **Backend ringan:** Vercel Function sebagai proksi APIMS dengan cache 15 minit
- **Storan:** `localStorage` sahaja untuk v1

```
[PWA] ──► [Service Worker cache] ──► [/api/aqi (Vercel, cache 15 min)] ──► APIMS / Open-Meteo
```

## 8. UI/UX

### Prinsip reka bentuk

1. **Jawapan dahulu, butiran kemudian.** Skrin pertama menjawab soalan "selamat atau tidak?" dalam masa 1 saat.
2. **Warna membawa makna.** Warna aksen atau latar berubah ikut kategori, tetapi label teks sentiasa dipaparkan bersama.
3. **Mudah guna dengan satu tangan.** Navigasi di bahagian bawah skrin dan sasaran sentuh sekurang-kurangnya 44 px.
4. **Tenang, bukan panik.** Nada nasihat ringkas dan berguna, tanpa bahasa yang menakutkan.
5. **Jujur tentang data.** Masa kemas kini, sumber data dan status luar talian sentiasa kelihatan.

### Struktur skrin

| Skrin       | Kandungan                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Utama**   | Nama lokasi (ketik untuk tukar), nombor IPU besar, label kategori, penunjuk trend, 2–3 nasihat utama dan masa kemas kini |
| **Trend**   | Graf 24 jam dan ramalan 3 hari (P1)                                                                                      |
| **Lokasi**  | Senarai kegemaran dengan bacaan IPU dan warna masing-masing, serta butang tambah lokasi                                  |
| **Tetapan** | Profil kesihatan, tema, bahasa (BM/EN) dan maklumat sumber data                                                          |

Navigasi bawah: **Utama · Trend · Lokasi · Tetapan**

### Arah visual (diputuskan 11 Okt 2026)

Mockup: [Hezy Mockups](https://claude.ai/artifact/32a5NEFiyVGKsEXRgUmxbp)

| Skrin                | Gaya dipilih                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Utama**            | **C. Langit berilustrasi**: ilustrasi kaki langit bandar yang makin kabur bila IPU naik, dengan panel bacaan di bawah |
| **Trend**            | **G. Garis masa harian**: kad "Masa terbaik untuk keluar", graf bar 24 jam dan purata pagi/petang/malam               |
| **Lokasi**           | Senarai kad gaya D (lalai), dengan togol ke paparan peta (P1, F10)                                                    |
| **Tetapan**          | Senarai berkumpulan gaya C: profil kesihatan, amaran, paparan, aplikasi (mockup M)                                    |
| **Tablet & desktop** | **Pilihan 2 — panorama + dua lajur** (mockup O)                                                                       |

### Susun atur responsif

| Lebar     | Susun atur                                                                                                                                                                         | Navigasi                                                         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| < 768 px  | Satu lajur: skrin C, G, L, M berasingan                                                                                                                                            | Bar bawah 4 tab                                                  |
| ≥ 768 px  | Pilihan 2: banner panorama langit (C) + kad IPU di atasnya; di bawah, dua lajur — kiri "Boleh keluar hari ini?" + Nasihat, kanan Trend 24 jam (G); kemudian baris lokasi kegemaran | Bar atas (pil Utama · Trend · Lokasi · Tetapan) + pemilih lokasi |
| ≥ 1280 px | Kandungan dihadkan pada lebar 1200 px, di tengah                                                                                                                                   | Sama                                                             |

Nota desktop:

- Dua lajur bertukar menjadi satu lajur bila lebar tidak cukup (flex-wrap), tanpa breakpoint tambahan.
- Tetapan dan Lokasi dibuka sebagai halaman/bahagian sendiri melalui bar atas; peta (Fasa 2) dipaparkan dalam bahagian Lokasi.
- Pintasan papan kekunci: `/` cari, `1`–`5` lokasi kegemaran, `T` tema.
- Animasi kabus panorama dimatikan bila `prefers-reduced-motion` aktif.

Pilihan lain yang dipertimbangkan: A (latar dinamik), B (kad dan cincin), E (Ya/Tidak), F (kad bertindan), H (maskot), I (brutalist), J (widget) dan K (trend dengan maskot).

### Kebolehcapaian

- Kontras teks sekurang-kurangnya 4.5:1 pada setiap warna kategori. Latar kuning dan oren menggunakan teks gelap.
- Label kategori sentiasa dipaparkan bersama warna.
- Nombor IPU ada `aria-label` lengkap, contohnya "IPU 156, Tidak Sihat".
- Menyokong saiz fon sistem dan `prefers-reduced-motion`.

### Keadaan khas

| Keadaan                  | Paparan                                                   |
| ------------------------ | --------------------------------------------------------- |
| Sedang dimuatkan         | Skeleton kad IPU, bukan spinner skrin penuh               |
| Luar talian              | Banner kelabu bersama masa bacaan terakhir                |
| Akses lokasi ditolak     | Terus papar pemilih negeri dan kawasan, bukan mesej ralat |
| Data lapuk (lebih 3 jam) | Label amaran "Data mungkin tidak terkini"                 |
| Ralat API                | Papar data cache terakhir dan butang "Cuba lagi"          |

## 9. Keperluan bukan fungsian

- Skor Lighthouse sekurang-kurangnya 90 bagi Performance, Accessibility dan PWA
- Saiz JS awal ≤ 200 KiB dimampat (React + Next sahaja ~115 KiB; diukur 168 KiB pada v0.1)
- Menyokong Chrome Android dan Safari iOS (2 versi terkini)
- Bahasa: Bahasa Melayu (utama) dan Bahasa Inggeris

## 10. Fasa pelaksanaan

| Fasa            | Skop                          |
| --------------- | ----------------------------- |
| **Fasa 1: MVP** | F1–F8 menggunakan Open-Meteo  |
| **Fasa 2**      | Proksi APIMS, F9, F10 dan F12 |
| **Fasa 3**      | F11 dan F13                   |

## 11. Risiko dan soalan terbuka

| Risiko atau soalan                               | Tindakan                                                                                                                         |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| APIMS menukar format atau menyekat scraping      | Guna Open-Meteo sebagai sandaran dan cache di pelayan                                                                            |
| Data model Open-Meteo berbeza daripada IPU rasmi | Label sebagai "Anggaran" sehingga APIMS disambungkan                                                                             |
| Formula penukaran PM2.5 kepada IPU               | Selesai: guna formula sub-indeks PM2.5 JAS (purata 24 jam). IPU rasmi = maksimum 6 pencemar, jadi Hezy label nilainya "Anggaran" |
| Ambang penutupan sekolah KPM                     | Sahkan dengan garis panduan terkini sebelum F11                                                                                  |
| Sokongan Web Push di iOS terhad                  | Beri penerangan dalam aplikasi supaya pengguna pasang PWA dahulu                                                                 |
