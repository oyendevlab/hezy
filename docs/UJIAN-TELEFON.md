# Senarai semakan: ujian di telefon sebenar

Ujian automatik (Playwright) sudah meliputi aliran utama, mod luar talian dan kebolehcapaian. Perkara di bawah hanya boleh disahkan pada peranti sebenar.

Buka **https://hezy.my** pada telefon.

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

## Ciri baharu v0.5.0

- [ ] Buka **https://hezy.my** (alamat lama hezy.vercel.app kini dialihkan); pasang semula Hezy dari hezy.my dan pilih lokasi serta hidupkan amaran semula
- [ ] Utama: langit bergerak ikut keadaan sebenar (awan, hujan, jerebu); waktu malam ada bulan dan bintang
- [ ] Utama: label "IPU", "● Rasmi · APIMS", ikon cuaca + suhu di kanan, ikon pada bento nasihat
- [ ] Utama (iPhone, Safari): banner "Pasang Hezy di skrin utama" → Cara pasang; ✕ menutup banner
- [ ] Trend: cip lokasi; tekan dan seret graf → lepas kembali ke jam semasa; garisan putus-putus
- [ ] Lokasi: Peta dahulu, tab Senarai di kanan; kegemaran yang sama dengan lokasi semasa bertanda SEMASA
- [ ] "Guna lokasi saya" → nama bandar terdekat (tanpa "Berhampiran")
- [ ] Tetapan → Privasi dan data anda
- [ ] Tetapan → Bahasa → English: halaman negeri dan kongsi juga dalam English

## Ciri baharu v0.5.1

- [ ] Utama: langit tetap; tatal → hanya kad putih bergerak; tiada jalur putih di pengepala
- [ ] Utama: tarik kad putih ke bawah → turun seperti getah (berhad), lepas → melantun; tarikan jauh → awan berputar di langit dan bacaan dimuat semula
- [ ] Utama: tatal hingga nombor IPU tersorok → pil "152 · Tidak Sihat" di pengepala
- [ ] Utama: ikon angin dan api (bilangan titik panas tebal)
- [ ] Utama: ⓘ di sebelah "Stesen … · km · masa" membuka butiran sumber
- [ ] Utama: kad "Lihat trend jam demi jam" dengan graf mini → Trend

## Ciri baharu v0.6.0

- [ ] Utama: tolak kad putih ke atas → berhenti tepat di atas (~124 px); lepas separuh jalan → melekat ke rehat atau atas
- [ ] Utama/Trend: ketik cip lokasi → helaian bawah (telefon) dengan lokasi semasa ✓, kegemaran + IPU, "Guna lokasi saya", "Tambah bandar"
- [ ] Muat semula (tarik ke bawah, Muat semula, atau tukar lokasi) → nombor IPU dikira naik/turun
- [ ] Android: tarik kad putih hingga ambang → getaran ringan sekali
- [ ] Buka Hezy dengan internet perlahan → rangka bentuk kad putih (bukan kotak kelabu)
- [ ] Bar navigasi: ikon terisi untuk halaman aktif
- [ ] Tukar tab → pudar pantas; Lokasi → IPU mengikut negeri → negeri → gelongsor ke kiri; pautan laluan kembali → ke kanan
- [ ] iPhone: buang dan pasang semula Hezy di skrin utama → skrin pembuka awan (terang dan gelap)
- [ ] Pengguna baharu (Tetapan → Padam data): pengenalan 3 skrin; Langkau berfungsi; tidak muncul semula
- [ ] Lokasi → Peta: cip Titik panas / Sensor / Angin di kiri atas; zum keluar → pin dihimpunkan; ketik himpunan → zum masuk
- [ ] Lokasi → Peta: ketik pin → kad di bawah peta; X atau ketik di luar untuk tutup
- [ ] Lokasi → Senarai: leret kegemaran ke kiri untuk buang; seret ⋮⋮ untuk susun semula
- [ ] Tetapan → Amaran (hidup) → **Hantar notifikasi ujian** → notifikasi "Hezy: notifikasi ujian" muncul; tekan lagi → "Tunggu … saat"
- [ ] Mod gelap: semua perkara di atas boleh dibaca

## Ciri baharu v0.7.0

- [ ] Pengguna baharu (Tetapan → Padam data): skrin alu-aluan terus dipaparkan (tiada kelipan Utama); togol BM | EN menukar bahasa
- [ ] Skrin alu-aluan: jalur "Malaysia sekarang" (negeri tertinggi dan terendah); ketik cip bandar → terus ke Utama; "Guna lokasi saya" meminta kebenaran GPS
- [ ] Utama (lawatan pertama): ⓘ pada pil tahap berdenyut sekali; ketik pil → helaian skala IPU dengan tahap anda ditanda
- [ ] Utama: kad "Hidupkan amaran" muncul bila IPU > 100 atau pada lawatan kedua; "Nanti" menyembunyikannya
- [ ] Lokasi → Peta: cip **Taburan IPU** → lapisan warna antara stesen (termasuk Sumatera/Singapura daripada WAQI) dengan legenda; **Angin** → zarah bergerak; peta tidak boleh dizum keluar melepasi Asia Tenggara
- [ ] Tetapan → Rutin amaran: pilihan **Amaran jerebu dijangka** dan **Amaran lonjakan** (hidup secara lalai)
- [ ] Notifikasi "Jerebu dijangka di … sekitar …" bila ramalan 6 jam melepasi ambang (sekali sehari); "IPU … naik mendadak: … → …" bila naik ≥ 30 dalam 3 jam (bergantung pada keadaan sebenar)
- [ ] Halaman negeri → **Gambar** → kad negeri dengan bendera; Kongsi gambar / Untuk Status (9:16) membuka helaian kongsi telefon
- [ ] Utama → Kongsi: kad lokasi dengan bendera negeri (tiada bendera bila lokasi GPS di sempadan negeri)
- [ ] Kongsi pautan halaman negeri di WhatsApp → pratonton kad negeri

## Ciri baharu v0.7.1

- [ ] iPhone: buang dan pasang semula Hezy di skrin utama → langit Utama hingga ke atas skrin (di belakang jam); jam boleh dibaca
- [ ] Trend, Lokasi, Tetapan: jalur langit pendek di atas (warna ikut tahap IPU); tatal ke bawah → jam masih boleh dibaca
- [ ] Utama: ayat nasihat ikut keadaan (pagi/petang/malam, IPU naik/turun, hujan, profil); tiada lagi "bersenam"
- [ ] Utama: tolak kad putih ke atas → melantun kembali; dengan notis sekolah atau kad amaran (kandungan panjang) → boleh ditatal hingga hujung dan melantun
- [ ] Profil Kanak-kanak: kad sekolah satu baris dengan ikon beg; ketik → helaian butiran
- [ ] Selepas 3 petang, bila IPU jam 2 petang > 180 atau > 150 tiga hari berturut-turut: "Sekolah mungkin ditutup esok" dan notifikasi (bergantung pada keadaan sebenar)

## Ciri baharu v0.7.2

- [ ] Trend, Lokasi, Tetapan: langit awan hingga ke belakang jam, kandungan dalam kad putih bersudut bulat; tatal → jalur langit di belakang jam
- [ ] Ketik pil tahap (Skala IPU), kad sekolah, Kongsi atau cip lokasi → helaian naik; X / ketik latar → helaian meluncur turun
- [ ] Tarik helaian ke bawah → tutup; tarikan pendek → melantun kembali
- [ ] Utama: ⓘ di sebelah "Stesen …" → helaian "Sumber bacaan" (kad Utama tidak berubah saiz)
- [ ] Hidupkan amaran dari kad kuning → "Amaran dihidupkan" dengan X; hilang sendiri selepas ~5 saat

## Ciri baharu v0.7.3

- [ ] Profil Kanak-kanak: kad sekolah dengan ⓘ, tajuk ringkas dan "Semak keputusan rasmi sekolah" (tiada nombor ambang atau "sekolah dibuka")
- [ ] Ketik kad → helaian berikon: aktiviti luar, keputusan rasmi oleh sekolah/PPD/JPN, "Berdasarkan IPU rasmi …"
- [ ] Bila IPU jam 2 petang kekal tinggi dua hari: "Bacaan tinggi berterusan · Pantau pengumuman sekolah" dan notifikasi dari 3 petang (bergantung pada keadaan sebenar)

## Ciri baharu v0.7.4

- [ ] Trend: legenda graf satu baris (Lepas · Ramalan · Kini); petunjuk "tekan dan seret" hilang selepas graf disentuh
- [ ] Trend: "Ramalan per jam" boleh dileret — IPU, ikon cuaca, suhu dan angin bagi 24 jam
- [ ] Trend: "Ramalan harian" — togol 3 hari / 5 hari; ketik baris → puncak IPU

## Ciri baharu v0.7.5

- [ ] Trend → Ramalan harian: setiap hari baris berasingan; kepala lajur berikon; kelembapan dipaparkan
- [ ] Ketik ⓘ di sebelah tajuk (Hari ini, Ramalan per jam, Ramalan harian, Sejarah) → helaian penerangan berikon
- [ ] Buka Trend selepas lama tidak dibuka → Ramalan per jam memaparkan rangka kelabu dahulu, tanpa menolak bahagian lain
- [ ] Sejarah 12 minggu: kotak kecil berwarna ikut tahap (lebih pekat = lebih tinggi); ketik kotak → kad "Khamis / 15 Oktober 2026", Maks dan Purata

## Ciri baharu v0.7.6

- [ ] Trend → Sejarah 12 minggu: kotak memenuhi lebar hingga tepi kanan (sama lebar dengan kad hari), kekal segi empat sama
- [ ] Di tablet/desktop: lebih banyak minggu dipaparkan dan tajuk berubah (contoh "Sejarah 20 minggu")

## Ciri baharu v0.7.7

- [ ] Lokasi → Peta: satu butang **Lapisan** (dengan bilangan aktif) di kiri atas; ketik → helaian suis; ⓘ memaparkan penerangan
- [ ] Tiada lagi perenggan teks di bawah peta; pil angin kecil di kiri bawah peta
- [ ] Butang skrin penuh (di bawah zum): peta memenuhi skrin; ✕, Escape atau gerak isyarat kembali menutupnya
- [ ] Buka Lokasi: peta dan jubin muncul segera; titik panas dan angin menyusul tanpa tersekat
- [ ] Lokasi → Senarai (halaman pendek): bar navigasi bawah kekal di bawah skrin, tidak terangkat
- [ ] **Tukar** dan **+ Tambah lokasi kegemaran** membuka helaian carian; hanya satu carian pada satu masa
- [ ] Kegemaran yang disimpan dari GPS memaparkan negeri (bukan "Lokasi semasa")

## Ciri baharu v0.7.8

- [ ] Tetapan disusun: Profil → Notifikasi → Amaran → Paparan → Aplikasi → Tentang data
- [ ] Profil: ketik baris profil → helaian 4 profil berikon; pilih → helaian tertutup, ambang lalai berubah
- [ ] Notifikasi: suis **Banner notifikasi**; bila hidup: "Bila dihantar" (Amaran sahaja / + Ringkasan 7 pagi), Waktu senyap (helaian), Hantar notifikasi ujian
- [ ] **Nombor pada ikon**: ikon Hezy di skrin utama menunjukkan IPU semasa; matikan → nombor hilang; ⓘ menerangkan had peranti (iPhone/Android/komputer)
- [ ] Amaran dimalapkan bila banner mati; Amaran awal dan Lonjakan mendadak sebagai suis; Lokasi amaran membuka Lokasi
- [ ] Padam data: helaian pengesahan (Batal / Padam), bukan dialog pelayar

## Ciri baharu v0.7.9

- [ ] Tetapan (bawah): kad **Tentang Hezy** dengan logo, nama dan versi
- [ ] **Apa yang baharu** → helaian 5 keluaran terakhir
- [ ] **Kongsi Hezy** → helaian kongsi telefon (atau "Pautan disalin")
- [ ] **Hantar maklum balas** → aplikasi e-mel dibuka ke oyendevlab@gmail.com dengan subjek dan versi
- [ ] Kad pembangun: gambar dalam bingkai bulat, "Syafiq", "Build. Create. Live"

## Ciri baharu v0.7.10

- [ ] Notifikasi: hanya Banner, **Waktu hantaran** dan Nombor pada ikon
- [ ] Amaran: Ambang (dengan keterangan lalai profil), Amaran awal, Lonjakan, **Waktu senyap**, Lokasi amaran, **Hantar notifikasi ujian** (baris berikon)
- [ ] Kad Tentang: Hezy / Semak Jerebu di Malaysia / Versi, baris demi baris
- [ ] Kredit pembangun kecil dan tenang di bawah kad Tentang

## Ciri baharu v0.7.11

- [ ] Suis yang hidup berwarna hijau lembut (Tetapan dan helaian Lapisan), berbeza daripada ikon hitam
- [ ] Pilihan segmen terpilih (Waktu hantaran, Ambang, Tema, Bahasa) berlatar hijau pucat, mod terang dan gelap

## Ciri baharu v0.7.12

- [ ] Ikon baharu di skrin utama (pasang semula Hezy jika ikon lama masih kelihatan), skrin pembuka dan logo dalam aplikasi
- [ ] Skrin alu-aluan: "Dengan meneruskan, anda bersetuju dengan Privasi dan Penafian" → helaian
- [ ] Tetapan → kad Tentang → Penafian
- [ ] Gambar kongsi (kad) memaparkan logo baharu

## Ciri baharu v0.7.13

- [ ] Tetapan: satu bahagian **Notifikasi dan Amaran** — Nombor pada ikon dahulu, kemudian Banner notifikasi
- [ ] Banner mati → tetapan amaran tersembunyi; hidupkan → Waktu hantaran, Ambang, Amaran awal, Lonjakan, Waktu senyap, Lokasi amaran, Notifikasi ujian muncul
- [ ] Notifikasi ujian: butang pil **Hantar** (bukan anak panah); selepas dihantar → "✓ Hantar lagi"
- [ ] Kad Tentang: **Padam data di peranti ini** di bawah Privasi → helaian dengan ikon amaran, Batal / Padam
- [ ] Kredit: "Learn. Build. Repeat"

## Ciri baharu v0.7.14

- [ ] Apa yang baharu: 3 keluaran terkini sahaja
- [ ] Kad Tentang: butang pil **Padam** di kanan baris "Padam data di peranti ini" → helaian pengesahan

## Ciri baharu v0.7.15

- [ ] Semua masa dalam AM/PM (Ramalan per jam, paksi graf, masa terbaik, waktu senyap, notifikasi); "12 AM" tidak terbalut
- [ ] Kongsi gambar: Hezy tebal, masa dijana di kanan atas; bendera + nama di kiri; IPU, tahap, APIMS (JAS), Bacaan … di kanan
- [ ] Graf kad: "Bacaan IPU per jam" dengan legenda Rasmi · Ramalan · Kini dan garis putus jam semasa

## v0.8.0 — semakan akhir siri polish

- [ ] Lalui semua bahagian v0.7.1–v0.7.15 di atas pada iPhone (PWA) dan Android
- [ ] Pasang semula Hezy untuk ikon baharu; semak skrin pembuka terang dan gelap
- [ ] Mod gelap: Utama, Trend, Lokasi, Tetapan, helaian

## v0.8.1 — keselamatan

- [ ] Utama, Trend, Lokasi (peta, jubin, sensor WAQI, titik panas, angin) dan Tetapan masih berfungsi seperti biasa
- [ ] Tetapan → Notifikasi: hidupkan banner, tukar pilihan, **Hantar** notifikasi ujian → notifikasi diterima
- [ ] Kongsi gambar dari Utama dan negeri → pratonton dan helaian kongsi berfungsi

## v0.8.2 — laju dan stabil

- [ ] Pilih lokasi baharu (cth. bandar yang belum pernah dibuka): nombor IPU muncul dalam beberapa saat
- [ ] Jika ikon cuaca atau baris angin tiada pada mulanya, ia muncul sendiri dalam ~1–2 minit (tanpa tarik untuk muat semula)
- [ ] Utama, Trend dan Lokasi masih memaparkan bacaan rasmi APIMS, graf dan ramalan seperti biasa

## v0.8.3 — ramalan harian unit JAS

- [ ] Trend → Ramalan harian: nombor esok dekat dengan IPU rasmi semasa (tidak melompat tinggi/rendah tanpa sebab) dan berubah beransur-ansur dari hari ke hari
- [ ] Ketik baris hari: puncak tidak lagi jauh melebihi purata (cth. tiada puncak 200+ bila purata ~100)
- [ ] ⓘ Ramalan harian menerangkan "dikira seperti JAS (purata 24 jam)"
- [ ] Amaran ramalan esok (jam 8 malam) hanya bila purata esok melepasi ambang

## v0.8.4 — amaran tepat pada masanya

- [ ] Dengan amaran dihidupkan dan IPU melepasi ambang: notifikasi tiba dalam kira-kira 15–30 minit selepas bacaan APIMS baharu (bukan beberapa jam)
- [ ] Ringkasan pagi (jika dipilih) tiba antara 7–9 pagi
- [ ] Amaran ramalan esok (jika dipilih) tiba antara 8–10 malam
- [ ] Tiada notifikasi berganda untuk bacaan yang sama

## v0.8.5 — anggaran kawasan tanpa stesen

- [ ] Pilih lokasi jauh dari stesen (cth. Mersing, Kuala Lipis, Lawas): label "Anggaran dibetulkan" di bawah nombor
- [ ] ⓘ sumber bacaan: "dibetulkan dengan N stesen APIMS berdekatan" dan nama stesen terdekat dengan jarak
- [ ] Nombor anggaran hampir dengan IPU stesen berdekatan (tidak jauh lebih rendah seperti sebelum ini)
- [ ] Lokasi dengan stesen dalam 30 km masih memaparkan "Rasmi · APIMS"
- [ ] Selepas minit ke-10–40 setiap jam, bacaan rasmi jam baharu muncul dalam beberapa minit (tarik untuk muat semula)

## v0.8.6 — MetMalaysia dan sensor melalui pelayan

- [ ] Bila MetMalaysia mengeluarkan amaran ribut petir/hujan lebat untuk negeri anda: kad "Amaran cuaca MetMalaysia" di Utama dengan daerah terlibat dan "Sehingga …"
- [ ] Trend: bahagian "Ramalan rasmi MetMalaysia" (3 hari: ringkasan, pagi/petang/malam, suhu)
- [ ] Bahasa Inggeris: tajuk amaran dan frasa ramalan diterjemah
- [ ] Lokasi → Peta: pin sensor WAQI bergaris putus dan taburan IPU luar Malaysia masih dipaparkan

## v0.8.7 — graf dan ramalan per jam sepadan

- [ ] Trend: nilai "Kini" dalam Ramalan per jam sama dengan bar jam semasa dalam graf
- [ ] Jam ramalan berubah beransur-ansur dari bacaan rasmi (tiada jatuh mendadak pada waktu malam)
- [ ] Masa terbaik keluar: IPU yang dipaparkan hampir dengan bacaan rasmi (bukan jauh lebih rendah)
- [ ] Lokasi tanpa stesen (cth. Mersing): "Kini" juga sama dengan graf

## v0.8.8 — ramalan beberapa hari

- [ ] Trend → Ramalan harian (5 hari): semasa jerebu, hari ke-3 hingga ke-5 tidak jatuh mendadak ke tahap Sederhana tanpa sebab
- [ ] Ramalan per jam beberapa jam akan datang tidak berubah (masih bermula pada bacaan rasmi)

## v0.8.9 — Ramalan harian guna MetMalaysia

- [ ] Trend → Ramalan harian: lajur kedua kini ikon keadaan cuaca (ribut petir, hujan, jerebu, tiada hujan), bukan peratus hujan
- [ ] Suhu harian sama dengan ramalan rasmi MetMalaysia; hari ke-3 dilabel "Lusa"
- [ ] Ketik baris hari: puncak IPU dan ringkasan MetMalaysia
- [ ] Ramalan rasmi MetMalaysia: tajuk tanpa ikon, ⓘ memaparkan negeri dan sumber; kad Hari ini / Esok / Lusa dengan ikon pagi, petang, malam
- [ ] Bahasa Inggeris: frasa dan kelayakan (cth. "most places", "inland") diterjemah

## v0.8.10 — bacaan rasmi lebih stabil

- [ ] Lokasi dengan stesen (cth. Putrajaya) sentiasa "Rasmi · APIMS", termasuk sejurus selepas kemas kini aplikasi
- [ ] Jika sekali-sekala "Anggaran model" muncul untuk lokasi berstesen, ia kembali kepada "Rasmi · APIMS" sendiri dalam ~1–2 minit (tanpa tarik untuk muat semula)

## Jika ada masalah

Ambil tangkapan skrin dan catat model telefon serta versi OS, kemudian buka isu di
https://github.com/oyendevlab/hezy/issues.
