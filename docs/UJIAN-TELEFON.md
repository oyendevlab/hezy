# Senarai semakan: ujian di telefon sebenar

Ujian automatik (Playwright) sudah meliputi aliran utama, mod luar talian dan kebolehcapaian. Perkara di bawah hanya boleh disahkan pada peranti sebenar.

Buka **https://hezy.vercel.app** pada telefon.

## Android (Chrome)

- [ ] Halaman alu-aluan dipaparkan; **Guna lokasi saya** meminta kebenaran lokasi
- [ ] Selepas benarkan: nama "Berhampiran …" dan nombor IPU dipaparkan
- [ ] Tolak kebenaran lokasi → mesej ralat + carian kawasan masih berfungsi
- [ ] Menu ⋮ → **Pasang aplikasi** (atau butang **Pasang** di Tetapan) memasang Hezy
- [ ] Ikon Hezy di skrin utama tidak terpotong (ikon maskable)
- [ ] Dibuka dari ikon: tiada bar alamat pelayar
- [ ] Mod pesawat → buka Hezy dari ikon → bacaan terakhir + banner "Luar talian"
- [ ] Butang kongsi di skrin Utama membuka helaian kongsi Android

## iPhone (Safari)

- [ ] Aliran lokasi seperti di atas
- [ ] Tetapan → **Pasang Hezy** memaparkan arahan "Tambah ke Skrin Utama"
- [ ] Kongsi → **Tambah ke Skrin Utama** → ikon Hezy (bukan tangkapan skrin)
- [ ] Dibuka dari ikon: skrin penuh, bar status boleh dibaca
- [ ] Mod pesawat → buka Hezy → bacaan terakhir dipaparkan
- [ ] Tema Gelap di Tetapan kekal selepas aplikasi ditutup dan dibuka semula

## Ciri baharu v0.3.0 (kedua-dua telefon)

- [ ] Tetapan → profil **Kanak-kanak** → kad **Status sekolah** dipaparkan di Utama dan Trend
- [ ] Trend: graf jam lepas (rasmi APIMS) dan jam akan datang (pudar) dengan legenda
- [ ] Tetapan → **Amaran**: hidupkan, pilih ambang 50 / 100 / 200 (Android, atau iPhone selepas dipasang)
- [ ] Lokasi → ketik loceng pada lokasi kegemaran → notifikasi amaran menyebut nama lokasi itu
- [ ] Kongsi dari Utama ke WhatsApp/Telegram → pratonton kad bergambar dengan IPU dan warna kategori
- [ ] Lokasi → **Lihat IPU semua stesen mengikut negeri** → jadual stesen negeri
- [ ] Tetapan → **Bahasa** → English: semua skrin dan notifikasi seterusnya dalam Bahasa Inggeris; kembali ke Bahasa Melayu

## Ciri baharu v0.3.1

- [ ] iPhone/iPad (Safari, belum dipasang): Tetapan → **Cara pasang** memaparkan 4 langkah; ikut langkah itu untuk memasang Hezy
- [ ] Lokasi → **Peta**: pin bergaris putus (sensor tambahan WAQI) dipaparkan; ketik pin → kad "Sensor tambahan WAQI · skala AQI AS"
- [ ] Matikan suis **Sensor tambahan** → pin bergaris putus hilang

## Ciri baharu v0.4.0

- [ ] Utama, Trend, Lokasi: tarik ke bawah dari atas → awan berputar → bacaan dimuat semula (termasuk Hezy yang dipasang di iPhone)
- [ ] Trend: leret jari di atas graf → nilai setiap jam dipaparkan di atas graf; "Kembali ke jam semasa"
- [ ] Trend: ramalan tidak lagi jatuh mendadak selepas jam semasa (label "Ramalan dibetulkan")
- [ ] Trend: heatmap "Sejarah 12 minggu" → ketik kotak untuk melihat maksimum dan purata hari itu
- [ ] Utama: baris angin, cth. "Angin dari tenggara (arah Kalimantan) · N titik panas di hulu angin"
- [ ] Lokasi → Peta: titik merah (titik panas NASA FIRMS) dan penunjuk angin; suis untuk matikan
- [ ] Lokasi: butang "IPU mengikut negeri ›" → negeri tersusun ikut peta (Perlis → Johor, Sarawak, Sabah, kemudian Wilayah)
- [ ] Utama → Kongsi: pratonton kad; "Kongsi gambar" dan "Untuk Status (9:16)" menghantar gambar ke WhatsApp
- [ ] Tetapan → Amaran → Rutin amaran: hidupkan Ringkasan pagi → notifikasi antara 7–11 pagi esok
- [ ] Tetapan → Tentang data: "Ketepatan anggaran ±N IPU"
- [ ] Android: tekan lama ikon Hezy → pintasan Trend, Peta, Tetapan
- [ ] Ikon Hezy yang dipasang menunjukkan nombor IPU (lencana) bila melebihi ambang amaran

## Jika ada masalah

Ambil tangkapan skrin dan catat model telefon serta versi OS, kemudian buka isu di
https://github.com/oyendevlab/hezy/issues.
