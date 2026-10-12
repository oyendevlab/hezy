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

## Jika ada masalah

Ambil tangkapan skrin dan catat model telefon serta versi OS, kemudian buka isu di
https://github.com/oyendevlab/hezy/issues.
