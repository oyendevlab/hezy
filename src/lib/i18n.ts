/**
 * Terjemahan UI. Teks Bahasa Melayu ialah kunci (gaya gettext); kamus EN memetakan
 * teks BM → EN. Teks tanpa terjemahan dipaparkan dalam BM, jadi tiada teks hilang.
 * Pembolehubah ditulis {nama} dalam kedua-dua bahasa.
 */

export type Lang = "ms" | "en";

export const LANGUAGES: readonly { key: Lang; label: string }[] = [
  { key: "ms", label: "Bahasa Melayu" },
  { key: "en", label: "English" },
];

export function isLang(value: unknown): value is Lang {
  return value === "ms" || value === "en";
}

const EN: Record<string, string> = {
  // Navigasi & umum
  Utama: "Home",
  Trend: "Trend",
  Lokasi: "Location",
  Tetapan: "Settings",
  "Navigasi utama": "Main navigation",
  "Cuba lagi": "Try again",
  "Maaf, ada ralat": "Sorry, something went wrong",
  "Ralat ini telah dilaporkan secara automatik. Cuba muat semula halaman.":
    "This error has been reported automatically. Try reloading the page.",
  "Ralat tidak diketahui.": "Unknown error.",
  "Tiada sambungan internet.": "No internet connection.",
  "Data kualiti udara tidak dapat diambil. Cuba lagi sebentar.":
    "Air quality data could not be fetched. Please try again shortly.",
  "Luar talian · Memaparkan bacaan terakhir yang disimpan":
    "Offline · Showing the last saved reading",
  "Kongsi status": "Share status",
  "IPU rasmi APIMS (JAS)": "Official APIMS API (DOE)",
  "Anggaran IPU daripada PM2.5": "API estimated from PM2.5",
  "Semak jerebu di lokasi anda": "Check the haze where you are",
  "Muat semula": "Refresh",
  "Memuat semula…": "Refreshing…",
  "Muat semula (R)": "Refresh (R)",
  "Status disalin": "Status copied",
  "Kongsi IPU terkini": "Share the latest API",
  "Tutup helaian": "Close",
  "Pratonton kad: {text}": "Card preview: {text}",
  "Kongsi gambar": "Share image",
  "Untuk Status (9:16)": "For Status (9:16)",
  "Salin pautan": "Copy link",
  "Pautan disalin": "Link copied",
  "Pautan tidak dapat disalin.": "The link could not be copied.",
  "Imej dimuat turun dan pautan disalin.": "Image downloaded and link copied.",
  "Menyediakan imej…": "Preparing image…",
  "Hezy — semak jerebu": "Hezy — check the haze",
  "IPU {name}: {ipu} ({label}) · via Hezy":
    "API {name}: {ipu} ({label}) · via Hezy",

  // Kategori IPU
  Baik: "Good",
  Sederhana: "Moderate",
  "Tidak Sihat": "Unhealthy",
  "Sangat Tidak Sihat": "Very Unhealthy",
  Berbahaya: "Hazardous",

  // Profil
  Umum: "General",
  "Kanak-kanak": "Children",
  "Asma / paru-paru": "Asthma / lungs",
  "Warga emas": "Elderly",

  // Nasihat
  "Udara bersih. Aktiviti luar seperti biasa.":
    "Clean air. Outdoor activities as usual.",
  "Sesuai untuk bersenam di luar": "Good for outdoor exercise",
  "Buka tingkap untuk pengudaraan": "Open windows for ventilation",
  "Aktiviti luar seperti biasa. Kumpulan sensitif perlu berwaspada.":
    "Outdoor activities as usual. Sensitive groups should be careful.",
  "Tiada sekatan aktiviti luar": "No limits on outdoor activities",
  "Kekalkan gaya hidup sihat": "Keep a healthy lifestyle",
  "Bawa inhaler bila keluar": "Carry an inhaler when going out",
  "Pantau anak jika batuk atau sesak nafas":
    "Watch children for coughing or breathlessness",
  "Hadkan aktiviti luar hari ini.": "Limit outdoor activities today.",
  // Nasihat ikut keadaan (v0.7.1)
  "Udara masih bersih, tetapi IPU sedang naik.":
    "The air is still clean, but the API is rising.",
  "Udara kembali bersih. Aktiviti luar seperti biasa.":
    "The air is clean again. Outdoor activities as usual.",
  "Udara bersih. Bawa payung jika keluar.":
    "Clean air. Bring an umbrella if you go out.",
  "Udara bersih pagi ini. Sesuai untuk aktiviti luar.":
    "Clean air this morning. Good for outdoor activities.",
  "Pagi yang baik untuk keluar rumah.": "A good morning to head outside.",
  "Udara bersih petang ini. Nikmati masa di luar.":
    "Clean air this afternoon. Enjoy your time outside.",
  "Udara bersih malam ini. Buka tingkap untuk udara segar.":
    "Clean air tonight. Open the windows for fresh air.",
  "Udara bersih. Sesuai untuk berjalan malam.":
    "Clean air. Good for an evening walk.",
  "Anak boleh bermain di luar. Pantau jika batuk.":
    "Children can play outside. Watch for coughing.",
  "Aktiviti luar boleh. Bawa inhaler bersama.":
    "Outdoor activities are fine. Keep your inhaler with you.",
  "Jalan santai boleh diteruskan. Berehat jika penat.":
    "Light walks are fine. Rest if you feel tired.",
  "IPU sedang naik. Pantau bacaan jika merancang aktiviti luar.":
    "The API is rising. Keep an eye on it if you plan to be outside.",
  "Udara semakin baik. Aktiviti luar seperti biasa.":
    "The air is improving. Outdoor activities as usual.",
  "Hujan membantu membersihkan udara. Aktiviti luar seperti biasa.":
    "Rain helps clear the air. Outdoor activities as usual.",
  "Udara sederhana pagi ini. Aktiviti luar masih boleh.":
    "Moderate air this morning. Outdoor activities are still fine.",
  "Aktiviti luar boleh diteruskan. Berehat jika rasa tidak selesa.":
    "Outdoor activities can continue. Take a break if you feel unwell.",
  "Udara sederhana malam ini. Tiada sekatan aktiviti.":
    "Moderate air tonight. No restrictions on activities.",
  "Anak elok bermain di dalam rumah hari ini.":
    "Children should play indoors today.",
  "Hadkan aktiviti luar dan bawa inhaler.":
    "Limit outdoor activities and carry your inhaler.",
  "Tangguhkan berjalan di luar hari ini.": "Put off walks outside today.",
  "Jerebu semakin teruk. Hadkan masa di luar.":
    "The haze is getting worse. Limit your time outside.",
  "Udara beransur pulih, tetapi hadkan aktiviti luar dahulu.":
    "The air is improving, but limit outdoor activities for now.",
  "Hujan membantu, tetapi udara masih tidak sihat.":
    "Rain helps, but the air is still unhealthy.",
  "Tangguhkan aktiviti luar pagi ini.":
    "Put off outdoor activities this morning.",
  "Elak aktiviti luar yang berat pagi ini.":
    "Avoid strenuous outdoor activities this morning.",
  "Kurangkan aktiviti luar petang ini.":
    "Cut back on outdoor activities this afternoon.",
  "Pilih aktiviti dalam bangunan petang ini.":
    "Choose indoor activities this afternoon.",
  "Tutup tingkap sebelum tidur malam ini.":
    "Close the windows before bed tonight.",
  "Kekal di dalam dan tutup tingkap malam ini.":
    "Stay in and keep the windows closed tonight.",
  "Anak perlu kekal di dalam rumah.": "Children should stay indoors.",
  "Kekal di dalam. Jumpa doktor jika simptom bertambah.":
    "Stay indoors. See a doctor if symptoms get worse.",
  "Jerebu semakin teruk. Kekal di dalam.":
    "The haze is getting worse. Stay indoors.",
  "Udara beransur pulih, tetapi masih sangat tidak sihat.":
    "The air is improving, but still very unhealthy.",
  "Hujan belum cukup. Udara masih sangat tidak sihat.":
    "The rain isn't enough. The air is still very unhealthy.",
  "Kekal di dalam pagi ini. Elak semua aktiviti luar.":
    "Stay indoors this morning. Avoid all outdoor activities.",
  "Tutup tingkap dan pintu. Guna penapis udara jika ada.":
    "Close windows and doors. Use an air purifier if you have one.",
  "Anak tidak boleh keluar rumah.": "Children must not go outside.",
  "Dapatkan rawatan segera jika sesak nafas.":
    "Seek treatment immediately if you are short of breath.",
  "Kekal di dalam dan dapatkan rawatan jika sesak nafas.":
    "Stay indoors and seek treatment if you are short of breath.",
  "IPU menurun, tetapi masih berbahaya. Jangan keluar.":
    "The API is falling, but still hazardous. Stay indoors.",
  "Kekal di dalam dan jumpa doktor jika tidak sihat.":
    "Stay indoors and see a doctor if you feel unwell.",
  "Kekal di dalam. Ikut pengumuman rasmi.":
    "Stay indoors. Follow official announcements.",
  "Pakai topeng N95 jika perlu keluar": "Wear an N95 mask if you must go out",
  "Tutup tingkap dan pintu": "Close windows and doors",
  "Minum air secukupnya": "Drink enough water",
  "Hadkan aktiviti luar dan sukan di sekolah":
    "Limit outdoor activities and sports at school",
  "Hadkan aktiviti luar dan sentiasa bawa inhaler":
    "Limit outdoor activities and always carry an inhaler",
  "Tangguhkan jalan pagi dan aktiviti di luar":
    "Postpone morning walks and outdoor activities",
  "Kekal di dalam dan kurangkan aktiviti fizikal.":
    "Stay indoors and reduce physical activity.",
  "Tutup tingkap, guna penapis udara jika ada":
    "Close windows; use an air purifier if you have one",
  "Elak aktiviti luar": "Avoid outdoor activities",
  "Anak perlu kekal di dalam rumah": "Children should stay indoors",
  "Jumpa doktor jika simptom bertambah teruk":
    "See a doctor if symptoms get worse",
  "Kekal di dalam dan jumpa doktor jika tidak sihat":
    "Stay indoors and see a doctor if unwell",
  "Jangan keluar. Ikut arahan pihak berkuasa.":
    "Do not go out. Follow official instructions.",
  "Elak semua aktiviti luar": "Avoid all outdoor activities",
  "Ikuti pengumuman rasmi di media":
    "Follow official announcements in the media",
  "Anak tidak boleh beraktiviti di luar": "Children must not be outdoors",
  "Dapatkan rawatan segera jika sesak nafas":
    "Get treatment immediately if breathless",
  "Dilarang beraktiviti di luar": "Outdoor activities not allowed",
  "Anak main di luar?": "Children playing outside?",
  "Bersenam di luar?": "Exercise outdoors?",
  "Buka tingkap?": "Open windows?",
  Boleh: "Yes",
  Tidak: "No",
  "Dalam rumah": "Indoors",
  Tutup: "Closed",

  // Utama
  "Selamat datang ke Hezy": "Welcome to Hezy",
  "Pilih lokasi untuk melihat Indeks Pencemaran Udara (IPU) dan nasihat kesihatan.":
    "Choose a location to see the Air Pollutant Index (API) and health advice.",
  "Guna lokasi saya": "Use my location",
  "Mengesan lokasi…": "Finding your location…",
  "ATAU PILIH KAWASAN": "OR CHOOSE AN AREA",
  "Cari kawasan atau negeri": "Search area or state",
  "Tiada kawasan sepadan.": "No matching area.",
  "— tukar lokasi": "— change location",
  "Mengemas kini…": "Updating…",
  "Data kualiti udara belum tersedia untuk lokasi ini.":
    "Air quality data is not yet available for this location.",
  "IPU melebihi 500: tahap Kecemasan. Ikut arahan Majlis Keselamatan Negara.":
    "API above 500: Emergency level. Follow National Security Council instructions.",
  "Rasmi APIMS · Stesen {station} ({km} km)":
    "Official APIMS · {station} station ({km} km)",
  "Anggaran model: {ipu}": "Model estimate: {ipu}",
  "Dikemas kini {time} · Anggaran daripada PM2.5 (Open-Meteo); tiada stesen APIMS berdekatan":
    "Updated {time} · Estimated from PM2.5 (Open-Meteo); no APIMS station nearby",
  "Boleh keluar hari ini?": "Can I go out today?",
  "Nasihat · {profile}": "Advice · {profile}",
  "Tukar profil": "Change profile",
  "Lokasi kegemaran": "Favourite locations",
  "Urus lokasi": "Manage locations",
  "TUKAR LOKASI": "CHANGE LOCATION",
  "(semasa)": "(current)",
  "Tiada lokasi kegemaran lagi.": "No favourite locations yet.",
  "Tambah bandar": "Add a city",
  "Indeks Pencemaran Udara": "Air Pollutant Index",
  // Kredit bendera negeri
  Kredit: "Credits",
  "Bendera negeri daripada Wikimedia Commons. Bendera Kelantan, Selangor dan Terengganu oleh Mysid, dan Sarawak oleh Matthew A. Lockhart, berlesen":
    "State flags from Wikimedia Commons. The flags of Kelantan, Selangor and Terengganu by Mysid, and Sarawak by Matthew A. Lockhart, are licensed under",
  "; bendera lain dalam domain awam. Bendera digunakan untuk mengenal pasti negeri sahaja; Hezy tidak berkaitan dengan mana-mana kerajaan negeri.":
    "; the other flags are in the public domain. Flags are used only to identify each state; Hezy is not affiliated with any state government.",
  "Senarai penuh sumber dan lesen": "Full list of sources and licences",
  // Skrin alu-aluan, skala IPU, kad amaran (v0.7.0)
  "Semak jerebu di kawasan anda": "Check the haze where you are",
  "IPU rasmi APIMS dan nasihat kesihatan, dikemas kini setiap jam.":
    "Official APIMS API readings and health advice, updated every hour.",
  "MALAYSIA SEKARANG": "MALAYSIA NOW",
  Tertinggi: "Highest",
  Terendah: "Lowest",
  "Lokasi dibundarkan ~1 km dan tidak disimpan.":
    "Your location is rounded to ~1 km and not stored.",
  "ATAU PILIH BANDAR": "OR PICK A CITY",
  "— lihat skala IPU": "— see the API scale",
  "Skala IPU": "API scale",
  Bahasa: "Language",
  "Sekarang {ipu} · {label}. Semakin tinggi nombor, semakin teruk jerebu.":
    "Now {ipu} · {label}. The higher the number, the worse the haze.",
  ANDA: "YOU",
  "Udara bersih": "Clean air",
  "Kumpulan sensitif perlu berwaspada": "Sensitive groups should take care",
  "Kurangkan aktiviti luar": "Reduce outdoor activity",
  "Kekal di dalam rumah": "Stay indoors",
  "Mahu diberitahu bila jerebu teruk?": "Want to know when the haze gets bad?",
  "Hezy akan menghantar notifikasi bila IPU {name} melepasi {threshold}.":
    "Hezy will notify you when the API in {name} goes above {threshold}.",
  "Anda boleh menukar ambang dan rutin amaran di Tetapan.":
    "You can change the threshold and alert routine in Settings.",
  Nanti: "Later",
  // Taburan IPU dan aliran angin (v0.7.0)
  "Taburan IPU": "API spread",
  "Anggaran IPU": "Estimated API",
  "Taburan IPU ialah anggaran antara stesen (interpolasi), bukan bacaan rasmi: di Malaysia daripada APIMS, di luar Malaysia daripada sensor WAQI (AQI AS ditukar ke skala IPU). Kawasan jauh dari stesen dibiarkan kosong.":
    "The API spread is an estimate between stations (interpolated), not an official reading: APIMS within Malaysia, WAQI sensors outside Malaysia (US AQI converted to the API scale). Areas far from any station are left blank.",
  "Garisan bergerak menunjukkan aliran angin pada ~1.5 km (850 hPa) yang membawa asap jerebu. Sumber: Open-Meteo.":
    "Moving lines show the wind at ~1.5 km (850 hPa), which carries haze smoke. Source: Open-Meteo.",
  "Sentiasa dipaparkan untuk profil Kanak-kanak. Termasuk notifikasi bila bacaan kekal tinggi (bila amaran hidup).":
    "Always shown for the Children profile. Includes a notification when readings stay high (when alerts are on).",
  "Sumber bacaan": "Reading source",
  // Trend (v0.7.5)
  "Tentang ramalan per jam": "About the hourly forecast",
  "Tentang ramalan harian": "About the daily forecast",
  "Tentang graf hari ini": "About today's chart",
  "Tentang sejarah {n} minggu": "About the {n}-week history",
  "Pil berwarna ialah ramalan IPU bagi jam itu":
    "The coloured pill is the forecast API for that hour",
  "Ikon cuaca dan suhu daripada Open-Meteo":
    "Weather icon and temperature from Open-Meteo",
  "Angin permukaan dalam km/j": "Surface wind in km/h",
  "Anak panah menunjukkan arah angin bertiup":
    "Arrows show where the wind blows",
  "Ramalan per jam tidak tersedia buat masa ini.":
    "The hourly forecast is not available right now.",
  "Nombor ialah purata IPU hari itu, dikira seperti JAS (purata 24 jam) dan bermula daripada bacaan rasmi terkini; ketik baris untuk lihat puncak":
    "The number is the day's average API, calculated like the DOE (24-hour average) and starting from the latest official reading; tap a row to see the peak",
  "Ramalan model CAMS (Open-Meteo), hingga 5 hari":
    "CAMS model forecast (Open-Meteo), up to 5 days",
  "Peluang hujan tertinggi hari itu": "Highest chance of rain that day",
  "Suhu maksimum / minimum": "Maximum / minimum temperature",
  "Purata kelembapan udara": "Average humidity",
  "Angin permukaan tertinggi (km/j) dan arahnya":
    "Strongest surface wind (km/h) and its direction",
  "purata IPU {ipu}": "average API {ipu}",
  "hujan {n}%": "rain {n}%",
  "kelembapan {n}%": "humidity {n}%",
  "angin {n} km/j": "wind {n} km/h",
  "Bar pekat: bacaan jam lepas (rasmi APIMS jika ada). Bar pudar: ramalan.":
    "Solid bars: past hours (official APIMS when available). Faded bars: forecast.",
  "Tekan dan seret graf untuk melihat jam lain":
    "Press and drag the chart to see other hours",
  "Setiap kotak ialah IPU maksimum satu hari di stesen APIMS terdekat":
    "Each square is one day's maximum API at the nearest APIMS station",
  "Warna ikut kategori APIMS (JAS); lebih pekat bila IPU lebih tinggi dalam kategori itu. IPU melebihi 500 ialah tahap Kecemasan.":
    "Colours follow the APIMS (DOE) categories; deeper when the API is higher within that category. An API above 500 is an Emergency.",
  "Purata {avg}": "Average {avg}",
  "Petunjuk warna: Baik hingga Berbahaya": "Colour key: Good to Hazardous",
  // Trend (v0.7.4)
  "Lepas (rasmi)": "Past (official)",
  "Lepas (anggaran)": "Past (estimate)",
  "Ramalan dibetulkan dengan bacaan APIMS":
    "Forecast corrected with APIMS readings",
  "PURATA RAMALAN HARI INI": "TODAY'S AVERAGE FORECAST",
  "Ramalan per jam": "Hourly forecast",
  "Ramalan per jam, 24 jam akan datang": "Hourly forecast, next 24 hours",
  "24 jam · leret →": "24 hours · swipe →",
  "Angin permukaan dalam km/j · anak panah menunjukkan arah angin bertiup":
    "Surface wind in km/h · arrows show where the wind blows",
  "Ramalan harian": "Daily forecast",
  "Hari ini": "Today",
  "Tempoh ramalan": "Forecast range",
  "{n} hari": "{n} days",
  "{n} km/j": "{n} km/h",
  "Puncak ~{peak} · {label}": "Peak ~{peak} · {label}",
  "Nombor ialah purata IPU hari itu · ketik untuk lihat puncak · ramalan model CAMS":
    "Numbers are the day's average API · tap to see the peak · CAMS model forecast",
  // Status sekolah (v0.7.3)
  "Aktiviti luar dihentikan": "Outdoor activities stopped",
  "Aktiviti luar dibenarkan": "Outdoor activities allowed",
  "Semak keputusan rasmi sekolah": "Check the school's official decision",
  "Bacaan tinggi berterusan · Pantau pengumuman sekolah":
    "Readings stay high · Watch for school announcements",
  "— butiran status sekolah": "— school status details",
  "Tiada perhimpunan, sukan atau kokurikulum di luar":
    "No outdoor assemblies, sports or co-curricular activities",
  "IPU sangat tinggi: semak pengumuman PdPR":
    "Very high API: check announcements on home-based learning",
  "Bacaan tinggi berterusan: pantau pengumuman untuk esok":
    "Readings stay high: watch for announcements about tomorrow",
  "Keputusan rasmi oleh sekolah, PPD dan JPN":
    "Official decisions are made by schools and education offices",
  "Berdasarkan IPU rasmi {ipu} · {time}":
    "Based on official API {ipu} · {time}",
  "Berdasarkan anggaran IPU {ipu} · {time}":
    "Based on estimated API {ipu} · {time}",
  "IPU di {name} kekal tinggi ({ipu})": "{name} API stays high ({ipu})",
  "Semak pengumuman sekolah untuk esok.":
    "Check school announcements for tomorrow.",
  "Tukar lokasi": "Change location",
  "Nombor utama ialah bacaan rasmi stesen APIMS terdekat. Anggaran model dikira daripada PM2.5 di koordinat anda dan boleh berbeza daripada bacaan rasmi.":
    "The main number is the official reading from the nearest APIMS station. The model estimate is calculated from PM2.5 at your location and may differ from the official reading.",
  "Tiada stesen APIMS berdekatan, jadi nombor utama ialah anggaran daripada PM2.5 (model CAMS) di koordinat anda.":
    "There is no APIMS station nearby, so the main number is an estimate from PM2.5 (CAMS model) at your location.",
  // Kad imej negeri (v0.7.0)
  "IPU tertinggi · {station}": "Highest API · {station}",
  "{n} daripada {total} stesen melebihi IPU 100":
    "{n} of {total} stations above API 100",
  "Tiada stesen melebihi IPU 100": "No station above API 100",
  "Bacaan APIMS tidak tersedia buat masa ini.":
    "APIMS readings are not available right now.",
  "IPU {state} hari ini · via Hezy": "{state} API today · via Hezy",
  Gambar: "Image",
  "Kongsi gambar {state}": "Share {state} image",
  // Amaran lonjakan dan jerebu dijangka (v0.7.0)
  "IPU {name} naik mendadak: {from} → {to}":
    "{name} API rising fast: {from} → {to}",
  "Naik {rise} dalam {hours} jam.": "Up {rise} in {hours} hours.",
  "Jerebu dijangka di {name} sekitar {time}":
    "Haze expected in {name} around {time}",
  "Ramalan IPU ~{ipu} ({label}) dalam {hours} jam akan datang.":
    "Forecast API ~{ipu} ({label}) within the next {hours} hours.",
  "Amaran jerebu dijangka": "Haze expected alert",
  "Bila ramalan 6 jam akan datang melepasi ambang anda":
    "When the forecast for the next 6 hours goes above your threshold",
  "Amaran lonjakan": "Rapid rise alert",
  "Bila IPU naik 30 atau lebih dalam 3 jam, walaupun di bawah ambang":
    "When the API rises by 30 or more within 3 hours, even below your threshold",
  // Notifikasi ujian
  "Hantar notifikasi ujian": "Send a test notification",
  "Menghantar…": "Sending…",
  "Dihantar. Notifikasi sepatutnya muncul dalam beberapa saat.":
    "Sent. The notification should appear within a few seconds.",
  "Semak bahawa amaran sampai ke peranti ini. Status amaran tidak berubah.":
    "Check that alerts reach this device. Your alert status won't change.",
  "Tunggu {seconds} saat sebelum menghantar lagi.":
    "Wait {seconds} seconds before sending again.",
  "Langganan tidak dijumpai. Matikan dan hidupkan semula amaran.":
    "Subscription not found. Turn alerts off and on again.",
  "Langganan sudah tamat. Matikan dan hidupkan semula amaran.":
    "Subscription has expired. Turn alerts off and on again.",
  "Notifikasi ujian tidak dapat dihantar. Cuba lagi.":
    "The test notification could not be sent. Try again.",
  // Kegemaran: leret dan susun semula
  "{name} dipindah ke kedudukan {n} daripada {total}":
    "{name} moved to position {n} of {total}",
  "{name} dibuang daripada kegemaran": "{name} removed from favourites",
  "Susun semula {name}, kedudukan {n} daripada {total}. Guna anak panah atas atau bawah.":
    "Reorder {name}, position {n} of {total}. Use the up or down arrow keys.",
  Buang: "Remove",
  // Peta: cip lapisan dan himpunan pin
  "Lapisan peta": "Map layers",
  "Titik panas ({count})": "Hotspots ({count})",
  "Sensor ({count})": "Sensors ({count})",
  "Sumber: NASA FIRMS.": "Source: NASA FIRMS.",
  "{count} stesen": "{count} stations",
  "{count} stesen, IPU tertinggi {ipu}": "{count} stations, highest API {ipu}",
  "{count} sensor, AQI tertinggi {aqi}": "{count} sensors, highest AQI {aqi}",
  Angin: "Wind",
  // Pengenalan pengguna baharu
  Langkau: "Skip",
  Kembali: "Back",
  Seterusnya: "Next",
  "Mula guna Hezy": "Start using Hezy",
  "LANGKAH {n} DARIPADA {total}": "STEP {n} OF {total}",
  "Apa itu IPU?": "What is the API?",
  "Di mana anda berada?": "Where are you?",
  "Dapatkan amaran jerebu": "Get haze alerts",
  "Indeks Pencemaran Udara (IPU) mengukur kebersihan udara. Semakin tinggi nombornya, semakin teruk jerebu.":
    "The Air Pollutant Index (API) measures how clean the air is. The higher the number, the worse the haze.",
  "Sumber rasmi: APIMS, Jabatan Alam Sekitar.":
    "Official source: APIMS, Department of Environment.",
  "Pilih lokasi untuk melihat IPU dan nasihat kesihatan untuk kawasan anda.":
    "Choose a location to see the API and health advice for your area.",
  "Lokasi dipilih: {name}": "Location chosen: {name}",
  "Hezy boleh memberitahu anda bila IPU di lokasi anda melepasi tahap tidak sihat, dan ringkasan setiap pagi.":
    "Hezy can notify you when the API at your location becomes unhealthy, plus a summary every morning.",
  "Hidupkan amaran": "Turn on alerts",
  "Amaran dihidupkan": "Alerts on",
  "Di iPhone, pasang Hezy di skrin utama dahulu:":
    "On iPhone, add Hezy to your Home Screen first:",
  "Anda boleh menukar amaran bila-bila masa di Tetapan.":
    "You can change alerts any time in Settings.",
  "IPU {ipu}, {label}": "API {ipu}, {label}",
  "Data mungkin tidak terkini.": "Data may be out of date.",
  "{error} Memaparkan bacaan {time}.":
    "{error} Showing the reading from {time}.",
  "{error} Memaparkan bacaan terakhir.": "{error} Showing the last reading.",

  // Status sekolah
  "STATUS SEKOLAH": "SCHOOL STATUS",
  "Sekolah mungkin ditutup": "Schools may be closed",

  // Trend
  "MASA TERBAIK UNTUK KELUAR": "BEST TIME TO GO OUT",
  "Anggaran IPU ~{ipu} · {label}": "Estimated API ~{ipu} · {label}",
  "Hari ini, jam demi jam": "Today, hour by hour",
  "Lihat trend jam demi jam": "See the hour-by-hour trend",
  "Selepas {time}: ramalan": "After {time}: forecast",
  Pagi: "Morning",
  Petang: "Afternoon",
  Malam: "Night",
  "6 pg – 12 tgh": "6 am – 12 pm",
  "12 tgh – 6 ptg": "12 – 6 pm",
  "6 ptg – 12 mlm": "6 pm – 12 am",
  "Ramalan 3 hari": "3-day forecast",
  Anggaran: "Estimate",
  "Purata · maks {max}": "Average · max {max}",
  "Jam lepas dan purata menggunakan bacaan rasmi APIMS stesen terdekat jika ada. Ramalan dan masa terbaik menggunakan IPU sejam daripada PM2.5 model (formula JAS).":
    "Past hours and averages use official APIMS readings from the nearest station when available. Forecasts and the best time use hourly API from model PM2.5 (DOE formula).",
  "Graf IPU hari ini. Tertinggi {max} pada {maxTime}, terendah {min} pada {minTime}.":
    "Today's API chart. Highest {max} at {maxTime}, lowest {min} at {minTime}.",
  "Graf IPU hari ini. Data tidak mencukupi.":
    "Today's API chart. Not enough data.",
  "Jam lepas: bacaan rasmi APIMS": "Past hours: official APIMS readings",
  "Jam lepas: anggaran model": "Past hours: model estimate",
  "Jam akan datang: ramalan model": "Coming hours: model forecast",
  ramalan: "forecast",
  Kini: "Now",
  "Sejarah {n} minggu": "{n}-week history",
  "IPU maks harian · Stesen {station}": "Daily max API · {station} station",
  Isn: "Mon",
  Rab: "Wed",
  Jum: "Fri",
  "Heatmap IPU harian, {n} minggu": "Daily API heatmap, {n} weeks",
  "maks {max}, {label}": "max {max}, {label}",
  "(setakat ini)": "(so far)",
  Maks: "Max",
  "Purata {avg} · {hours} jam data": "Average {avg} · {hours} hours of data",
  "Petunjuk warna (kategori IPU APIMS)": "Colour key (APIMS API categories)",
  "Warna ikut IPU maksimum harian dan kategori APIMS (JAS). IPU melebihi 500 ialah tahap Kecemasan.":
    "Colours follow the daily maximum API and APIMS (DOE) categories. An API above 500 is an Emergency.",
  "Data dikumpul sejak {date} ({count} hari).":
    "Data collected since {date} ({count} days).",
  "Data sedang dikumpul; heatmap akan terisi dari hari ke hari.":
    "Data is being collected; the heatmap will fill in day by day.",
  "Ramalan model": "Model forecast",
  "Bacaan rasmi APIMS": "Official APIMS reading",
  "Anggaran model": "Model estimate",
  "Graf IPU hari ini, jam demi jam": "Today's API chart, hour by hour",
  KINI: "NOW",
  "JAM LAIN": "OTHER HOUR",
  "Tekan dan seret graf untuk lihat jam lain":
    "Press and drag the chart to see other hours",
  rasmi: "official",
  anggaran: "estimate",
  "12 pg": "12 am",
  "6 pg": "6 am",
  "12 tgh": "12 pm",
  "6 ptg": "6 pm",
  "11 mlm": "11 pm",
  "Bandingkan lokasi": "Compare locations",
  "Pilih sehingga {max}": "Choose up to {max}",
  "Simpan sekurang-kurangnya satu lokasi kegemaran untuk membandingkan trend.":
    "Save at least one favourite location to compare trends.",
  "Lokasi untuk dibandingkan": "Locations to compare",
  "Graf perbandingan IPU hari ini": "Today's API comparison chart",
  "Garis penuh: jam lepas (rasmi APIMS jika ada). Garis putus: ramalan model.":
    "Solid line: past hours (official APIMS when available). Dashed line: model forecast.",
  "memuatkan…": "loading…",

  // Lokasi
  Senarai: "List",
  Peta: "Map",
  "Paparan lokasi": "Location view",
  "LOKASI SEMASA": "CURRENT LOCATION",
  SEMASA: "CURRENT",
  Simpan: "Save",
  Tukar: "Change",
  Batal: "Cancel",
  "KEGEMARAN ({count}/{max})": "FAVOURITES ({count}/{max})",
  "Ketik loceng untuk menerima amaran IPU bagi lokasi itu. Hidupkan amaran di Tetapan dahulu.":
    "Tap the bell to get API alerts for that location. Turn on alerts in Settings first.",
  "Amaran IPU untuk {name}": "API alerts for {name}",
  "Buang {name} daripada kegemaran": "Remove {name} from favourites",
  "+ Tambah lokasi kegemaran": "+ Add favourite location",
  "IPU mengikut negeri": "API by state",
  "Semua stesen APIMS di 13 negeri dan 3 wilayah":
    "All APIMS stations in 13 states and 3 federal territories",
  "Tiada data": "No data",
  "Lokasi semasa": "Current location",
  "Berhampiran {name}": "Near {name}",
  "Peta stesen APIMS": "APIMS station map",
  "Tiada sambungan internet. Peta memerlukan internet.":
    "No internet connection. The map needs internet.",
  "Stesen APIMS · {state}": "APIMS station · {state}",
  "Tiada bacaan": "No reading",
  "Jadikan lokasi semasa": "Set as current location",
  "Sudah disimpan": "Already saved",
  "Kegemaran penuh": "Favourites full",
  "STESEN TERDEKAT": "NEAREST STATIONS",
  "Sensor tambahan ({count}) · WAQI": "Extra sensors ({count}) · WAQI",
  "Pin bergaris putus ialah sensor tambahan dalam skala AQI AS, yang biasanya lebih tinggi daripada IPU bagi udara yang sama. Nombor utama dan amaran Hezy kekal menggunakan IPU rasmi.":
    "Dashed pins are extra sensors on the US AQI scale, which is usually higher than the API for the same air. Hezy's main number and alerts still use the official API.",
  "Sensor tambahan WAQI · skala AQI AS": "WAQI extra sensor · US AQI scale",
  "AQI AS": "US AQI",

  // Tetapan
  "PROFIL KESIHATAN": "HEALTH PROFILE",
  "Nasihat di skrin Utama disesuaikan mengikut profil ini.":
    "Advice on the Home screen is tailored to this profile.",
  "Papar status sekolah (panduan KPM)": "Show school status (MOE guidance)",
  TEMA: "THEME",
  "Ikut peranti": "Follow device",
  Terang: "Light",
  Cerah: "Clear",
  Gelap: "Dark",
  BAHASA: "LANGUAGE",
  AMARAN: "ALERTS",
  "Notifikasi belum tersedia.": "Notifications are not available yet.",
  "Pelayar ini tidak menyokong notifikasi.":
    "This browser does not support notifications.",
  "Di iPhone atau iPad, pasang Hezy di skrin utama dahulu, kemudian buka Hezy dari ikon untuk menghidupkan amaran.":
    "On iPhone or iPad, add Hezy to your Home Screen first, then open Hezy from the icon to turn on alerts.",
  "Pilih lokasi dahulu untuk menerima amaran.":
    "Choose a location first to receive alerts.",
  "Amaran bila IPU melebihi {threshold}": "Alert when API is above {threshold}",
  "Untuk {name}": "For {name}",
  " dan {count} lokasi kegemaran": " and {count} favourite locations",
  "disemak setiap jam": "checked hourly",
  "Kebenaran notifikasi ditolak. Benarkan notifikasi untuk Hezy dalam tetapan pelayar.":
    "Notification permission denied. Allow notifications for Hezy in your browser settings.",
  "Ambang amaran": "Alert threshold",
  "Rutin amaran": "Alert routine",
  "Ringkasan pagi (7 pagi)": "Morning summary (7 am)",
  "IPU semasa dan masa terbaik untuk keluar hari ini":
    "Current API and the best time to go out today",
  "Amaran ramalan esok (8 malam)": "Tomorrow's forecast alert (8 pm)",
  "Bila purata ramalan esok melebihi ambang anda":
    "When tomorrow's average forecast is above your threshold",
  "Waktu senyap": "Quiet hours",
  "Amaran ditangguh hingga waktu senyap tamat, kecuali IPU melebihi 300":
    "Alerts wait until quiet hours end, unless the API is above 300",
  Dari: "From",
  "Waktu senyap bermula": "Quiet hours start",
  "Waktu senyap tamat": "Quiet hours end",
  hingga: "to",
  " · lalai untuk profil {profile}": " · default for the {profile} profile",
  "IPU {threshold}": "API {threshold}",
  "50 = amaran awal (disyorkan untuk asma, kanak-kanak dan warga emas) · 100 = Tidak Sihat · 200 = Sangat Tidak Sihat":
    "50 = early alert (recommended for asthma, children and the elderly) · 100 = Unhealthy · 200 = Very Unhealthy",
  APLIKASI: "APP",
  "Pasang Hezy": "Install Hezy",
  Pasang: "Install",
  "Hezy sudah dipasang di peranti ini.": "Hezy is installed on this device.",
  "Cara pasang": "How to install",
  "Pasang Hezy di skrin utama": "Add Hezy to your Home Screen",
  "Untuk amaran IPU, lencana ikon dan akses pantas":
    "For API alerts, an icon badge and quick access",
  "Tutup banner pasang": "Close install banner",
  "Privasi dan data anda": "Privacy and your data",
  "Tutup panduan": "Close guide",
  "Ketik butang Kongsi di bar Safari (di iOS 26, ketik ⋯ dahulu, kemudian Kongsi).":
    "Tap the Share button in the Safari bar (on iOS 26, tap ⋯ first, then Share).",
  "Tatal ke bawah dan pilih “Tambah ke Skrin Utama”.":
    "Scroll down and choose “Add to Home Screen”.",
  "Pastikan “Buka sebagai Apl Web” dihidupkan, kemudian ketik Tambah.":
    "Make sure “Open as Web App” is on, then tap Add.",
  "Buka Hezy dari ikon di skrin utama.":
    "Open Hezy from the icon on your Home Screen.",
  "Buka menu pelayar dan pilih “Pasang aplikasi” atau “Tambah ke skrin utama”.":
    "Open the browser menu and choose “Install app” or “Add to Home screen”.",
  "Luar talian": "Offline",
  "Bacaan terakhir disimpan di peranti":
    "The last reading is saved on this device",
  "TENTANG DATA": "ABOUT THE DATA",
  "Bacaan rasmi": "Official readings",
  "APIMS (JAS), stesen ≤ 30 km": "APIMS (DOE), stations ≤ 30 km",
  "Anggaran & ramalan": "Estimates & forecast",
  "Langganan tidak dapat disimpan.": "The subscription could not be saved.",
  "Kaedah anggaran": "Estimation method",
  "Formula JAS, PM2.5 sahaja": "DOE formula, PM2.5 only",
  Versi: "Version",
  "Bila ada stesen APIMS dalam 30 km dengan bacaan 3 jam terakhir, Hezy memaparkan IPU rasmi stesen itu dan membetulkan ramalan model dengan bacaan tersebut. Jika tidak, Hezy memaparkan anggaran dan ramalan daripada PM2.5 model, yang mungkin berbeza daripada bacaan rasmi.":
    "When an APIMS station within 30 km has a reading from the last 3 hours, Hezy shows that station's official API and corrects the model forecast with it. Otherwise Hezy shows an estimate and forecast from model PM2.5, which may differ from official readings.",
  "Ramalan dibetulkan": "Corrected forecast",
  Ramalan: "Forecast",
  "Rasmi APIMS": "Official APIMS",
  "Anggaran dibetulkan": "Corrected estimate",
  IPU: "API",
  "Rasmi · APIMS": "Official · APIMS",
  "Cuaca: {temp}°, {label}": "Weather: {temp}°, {label}",
  "{label}, {max}°/{min}°": "{label}, {max}°/{min}°",
  Berjerebu: "Hazy",
  "Separa berawan": "Partly cloudy",
  Mendung: "Overcast",
  Berkabus: "Foggy",
  Gerimis: "Drizzle",
  Hujan: "Rain",
  "Ribut petir": "Thunderstorm",
  "Angin tenang": "Calm winds",
  "Angin dari {compass} (arah {source}) · {speed} km/j":
    "Wind from the {compass} (from {source}) · {speed} km/h",
  "Angin dari {compass} · {speed} km/j":
    "Wind from the {compass} · {speed} km/h",
  "· kawasan kebakaran biasa di hulu angin": "· a common fire area upwind",
  "titik panas di hulu angin · 2 hari": "fire hotspots upwind · 2 days",
  "Tiada titik panas dikesan di hulu angin · 2 hari":
    "No fire hotspots detected upwind · 2 days",
  "Kawasan kebakaran biasa di hulu angin": "A common fire area upwind",
  "Stesen {station} · {km} km · {time}": "{station} station · {km} km · {time}",
  "Anggaran model · dikemas kini {time}": "Model estimate · updated {time}",
  "Butiran sumber bacaan": "Reading source details",
  Sumber: "Source",
  Stesen: "Station",
  "Pencemar utama": "Main pollutant",
  "Masa bacaan": "Reading time",
  Ketepatan: "Accuracy",
  "IPU rasmi APIMS (Jabatan Alam Sekitar)":
    "Official APIMS API (Department of Environment)",
  "Anggaran daripada PM2.5 (Open-Meteo, model CAMS)":
    "Estimated from PM2.5 (Open-Meteo, CAMS model)",
  "Tiada stesen APIMS dalam 30 km": "No APIMS station within 30 km",
  "· {n} titik panas di hulu angin (2 hari, NASA FIRMS)":
    "· {n} fire hotspots upwind (2 days, NASA FIRMS)",
  "· tiada titik panas dikesan di hulu angin (2 hari)":
    "· no fire hotspots detected upwind (2 days)",
  "Titik panas ({count}) · NASA FIRMS, 2 hari":
    "Fire hotspots ({count}) · NASA FIRMS, 2 days",
  "Titik merah ialah kebakaran yang dikesan satelit VIIRS dalam 2 hari terakhir (setiap titik ≈ kawasan 5 km). Satelit tidak mengesan semua kebakaran, terutama api gambut di bawah permukaan atau di bawah awan.":
    "Red dots are fires detected by VIIRS satellites in the last 2 days (each dot ≈ a 5 km area). Satellites do not detect every fire, especially smouldering peat fires or fires under cloud.",
  Sumatera: "Sumatra",
  utara: "north",
  "timur laut": "north-east",
  timur: "east",
  tenggara: "south-east",
  selatan: "south",
  "barat daya": "south-west",
  barat: "west",
  "barat laut": "north-west",
  "biasanya ±{n} berbanding bacaan rasmi":
    "usually ±{n} from official readings",
  "biasanya ±{n}": "usually ±{n}",
  "Ketepatan anggaran": "Estimate accuracy",
  "Ketepatan ramalan esok": "Next-day forecast accuracy",
  "±{n} IPU": "±{n} API",
  "±{n} IPU (model asal ±{raw})": "±{n} API (raw model ±{raw})",
  "Sedang dikumpul": "Being collected",
  "Ralat purata 14 hari berbanding bacaan rasmi APIMS (semua stesen). Ramalan dinilai setiap malam: ramalan esok disimpan, kemudian dibandingkan dengan bacaan sebenar.":
    "Average 14-day error against official APIMS readings (all stations). Forecasts are checked nightly: tomorrow's forecast is saved, then compared with actual readings.",
  "Jam akan datang: ramalan dibetulkan dengan APIMS":
    "Coming hours: forecast corrected with APIMS",
  "Jam lepas menggunakan bacaan rasmi APIMS stesen {station}. Ramalan model (PM2.5, formula JAS) dibetulkan dengan bacaan itu: {offset} µg/m³ pada jam semasa, berkurang ke model dalam 48 jam.":
    "Past hours use official APIMS readings from the {station} station. The model forecast (PM2.5, DOE formula) is corrected with those readings: {offset} µg/m³ at the current hour, fading back to the model over 48 hours.",
  "Padam data di peranti ini": "Delete data on this device",
  "Padam lokasi, kegemaran dan tetapan yang disimpan di peranti ini?":
    "Delete the locations, favourites and settings saved on this device?",

  // Privasi
  Laluan: "Breadcrumb",
  Privasi: "Privacy",
  "Dikemas kini {date}": "Updated {date}",
  Ringkasnya: "In short",
  "Hezy tidak memerlukan akaun dan tidak menggunakan kuki pengiklanan.":
    "Hezy needs no account and uses no advertising cookies.",
  "Kami tidak menjual atau berkongsi data anda untuk pengiklanan.":
    "We do not sell or share your data for advertising.",
  "Lokasi dan tetapan": "Location and settings",
  "Lokasi semasa, kegemaran, profil kesihatan, tema dan bahasa disimpan dalam peranti anda sahaja (storan pelayar).":
    "Your current location, favourites, health profile, theme and language are stored on your device only (browser storage).",
  "Untuk mengambil bacaan, koordinat dihantar ke pelayan Hezy selepas dibundarkan kepada kira-kira 1 km, dan tidak disimpan.":
    "To fetch readings, coordinates are sent to Hezy's server rounded to about 1 km, and are not stored.",
  "GPS hanya digunakan bila anda menekan “Guna lokasi saya”.":
    "GPS is only used when you tap “Use my location”.",
  "Amaran notifikasi": "Notification alerts",
  "Bila anda menghidupkan amaran, pelayan menyimpan langganan notifikasi pelayar anda, lokasi amaran (dibundarkan kira-kira 1 km) dan namanya, ambang, bahasa serta pilihan rutin amaran.":
    "When you turn on alerts, the server stores your browser's notification subscription, alert locations (rounded to about 1 km) and their names, threshold, language and alert routine options.",
  "Data ini disimpan dalam Vercel Blob (Singapura) sehingga anda mematikan amaran atau langganan tamat, kemudian dipadam.":
    "This data is stored in Vercel Blob (Singapore) until you turn off alerts or the subscription expires, and is then deleted.",
  "Log ralat": "Error logs",
  "Bila aplikasi mengalami ralat, Hezy merekod mesej ralat, halaman, versi aplikasi dan jenis pelayar untuk membaikinya.":
    "When the app hits an error, Hezy records the error message, page, app version and browser type to fix it.",
  "Tiada alamat IP, lokasi atau maklumat peribadi direkod. Log dipadam selepas 14 hari.":
    "No IP address, location or personal information is recorded. Logs are deleted after 14 days.",
  "Statistik penggunaan": "Usage statistics",
  "Hezy menggunakan Vercel Web Analytics tanpa kuki untuk mengira paparan halaman, jenis peranti dan negara secara keseluruhan. Pengguna individu tidak dikenal pasti.":
    "Hezy uses cookie-free Vercel Web Analytics to count page views, device types and countries in aggregate. Individual users are not identified.",
  "Pihak ketiga": "Third parties",
  "Bacaan IPU daripada APIMS (Jabatan Alam Sekitar), cuaca dan anggaran daripada Open-Meteo, amaran dan ramalan MetMalaysia (data.gov.my), titik panas daripada NASA FIRMS dan sensor tambahan WAQI diambil oleh pelayan Hezy; maklumat peranti anda tidak dihantar kepada mereka.":
    "API readings from APIMS (Department of Environment), weather and estimates from Open-Meteo, MetMalaysia warnings and forecasts (data.gov.my), NASA FIRMS hotspots and extra WAQI sensors are fetched by the Hezy server; your device information is not sent to them.",
  "Jubin peta (OpenStreetMap) dimuat terus oleh pelayar anda bila anda membuka Peta, jadi OpenStreetMap boleh melihat alamat IP anda seperti mana-mana laman web.":
    "Map tiles (OpenStreetMap) are loaded directly by your browser when you open the Map, so OpenStreetMap can see your IP address like any website.",
  "Memadam data anda": "Deleting your data",
  "Tetapan → “Padam data di peranti ini” memadam semua data Hezy dalam peranti dan mematikan amaran (langganan dipadam daripada pelayan).":
    "Settings → “Delete data on this device” deletes all Hezy data on the device and turns off alerts (the subscription is deleted from the server).",
  "Mematikan amaran sahaja juga memadam langganan daripada pelayan.":
    "Turning off alerts alone also deletes the subscription from the server.",
  "Soalan atau permintaan berkaitan data:": "Questions or data requests:",

  // Negeri dan kongsi
  "Tekan negeri untuk melihat IPU setiap kawasan dan stesen.":
    "Tap a state to see the API for each area and station.",
  "Data APIMS tidak dapat diambil buat masa ini.":
    "APIMS data cannot be fetched right now.",
  "Data APIMS tidak dapat diambil buat masa ini. Cuba lagi sebentar.":
    "APIMS data cannot be fetched right now. Please try again shortly.",
  NEGERI: "STATES",
  "WILAYAH PERSEKUTUAN": "FEDERAL TERRITORIES",
  "{n} stesen": "{n} stations",
  maks: "max",
  "Sumber: APIMS, Jabatan Alam Sekitar. Dikemas kini setiap 15 minit.":
    "Source: APIMS, Department of Environment. Updated every 15 minutes.",
  "Semua negeri": "All states",
  "IPU {state} hari ini": "{state} API today",
  "{n} stesen dengan bacaan": "{n} stations with readings",
  tertinggi: "highest",
  "{n} stesen melebihi IPU 100": "{n} stations above API 100",
  "tiada stesen melebihi IPU 100": "no station above API 100",
  "Sumber: APIMS, Jabatan Alam Sekitar":
    "Source: APIMS, Department of Environment",
  "bacaan terkini {time}": "latest reading {time}",
  "Dikemas kini setiap 15 minit.": "Updated every 15 minutes.",
  "Semak lokasi saya dengan Hezy": "Check my location with Hezy",
  "IPU rasmi stesen APIMS di {state}": "Official APIMS station API in {state}",
  KAWASAN: "AREA",
  STATUS: "STATUS",
  PENCEMAR: "POLLUTANT",
  MASA: "TIME",
  "Status jerebu yang dikongsi": "Shared haze status",
  "Pautan kongsi ini tidak sah.": "This share link is not valid.",
  "IPU rasmi APIMS (JAS) semasa dikongsi. Bacaan terkini mungkin berbeza.":
    "Official APIMS (DOE) API when shared. The latest reading may differ.",
  "Anggaran IPU daripada PM2.5 semasa dikongsi. Bacaan terkini mungkin berbeza.":
    "API estimated from PM2.5 when shared. The latest reading may differ.",

  // GPS
  "Akses lokasi ditolak. Pilih kawasan secara manual di bawah.":
    "Location access denied. Choose an area manually below.",
  "Lokasi tidak dapat dikesan. Cuba lagi atau pilih kawasan secara manual.":
    "Your location could not be found. Try again or choose an area manually.",
  "Peranti ini tidak menyokong GPS. Pilih kawasan secara manual.":
    "This device does not support GPS. Choose an area manually.",

  // Notifikasi
  "Jerebu di {name}: IPU {ipu} ({label})":
    "Haze in {name}: API {ipu} ({label})",
  "Udara pulih di {name}: IPU {ipu}": "Air has improved in {name}: API {ipu}",
  "Esok di {name}: ramalan IPU {ipu} ({label})":
    "Tomorrow in {name}: forecast API {ipu} ({label})",
  "Puncak ~{max}.": "Peak ~{max}.",
  "Pagi ini di {name}: IPU {ipu} ({label})":
    "This morning in {name}: API {ipu} ({label})",
  "Masa terbaik keluar: {window} (~{ipu}).":
    "Best time to go out: {window} (~{ipu}).",
  // v0.7.7: Lokasi
  Lapisan: "Layers",
  "Lapisan peta, {count} aktif": "Map layers, {count} on",
  "Tentang lapisan peta": "About map layers",
  "Kebakaran dikesan satelit · 2 hari": "Fires detected by satellite · 2 days",
  "Pin bergaris putus · skala AQI AS": "Dashed pins · US AQI scale",
  "Anggaran antara stesen": "Estimated between stations",
  "Aliran angin pembawa jerebu": "Wind flow that carries haze",
  "Skrin penuh": "Full screen",
  "Keluar skrin penuh": "Exit full screen",
  "Zum masuk": "Zoom in",
  "Zum keluar": "Zoom out",
  "Ke lokasi saya": "Go to my location",
  "Tukar lokasi semasa": "Change current location",
  "Tambah kegemaran": "Add favourite",
  // v0.7.8: Tetapan
  Auto: "Auto",
  "Dewasa sihat · ambang lalai 100": "Healthy adults · default threshold 100",
  "Status sekolah dipaparkan · ambang 50": "School status shown · threshold 50",
  "Nasihat lebih berhati-hati · ambang 50":
    "More cautious advice · threshold 50",
  "Tentang data": "About the data",
  "Tentang data Hezy": "About Hezy's data",
  "Stesen APIMS dalam 30 km (bacaan 3 jam terakhir): IPU rasmi, dan ramalan model dibetulkan dengan bacaan itu":
    "APIMS station within 30 km (reading in the last 3 hours): official API, and the model forecast is corrected with it",
  "Tiada stesen: anggaran daripada PM2.5 model (formula JAS), mungkin berbeza daripada bacaan rasmi":
    "No station: estimate from model PM2.5 (DOE formula), may differ from official readings",
  "Ketepatan: ralat purata 14 hari berbanding bacaan rasmi; ramalan esok dinilai setiap malam":
    "Accuracy: 14-day mean error against official readings; tomorrow's forecast is scored every night",
  "Luar talian: bacaan terakhir disimpan di peranti":
    "Offline: the last reading is kept on your device",
  "Padam data?": "Clear data?",
  "Profil kesihatan: {profile}": "Health profile: {profile}",
  "Sentiasa untuk profil Kanak-kanak": "Always on for the Children profile",
  "Kad di Utama dan Trend": "Card on Home and Trend",
  "Profil kesihatan": "Health profile",
  PAPARAN: "DISPLAY",
  Tema: "Theme",
  "Lokasi, kegemaran dan tetapan di peranti ini akan dipadam. Amaran juga dimatikan.":
    "Locations, favourites and settings on this device will be deleted. Alerts are turned off too.",
  Padam: "Delete",
  "Hezy dipasang": "Hezy installed",
  "Skrin utama": "Home screen",
  "Di iPhone atau iPad, pasang Hezy di skrin utama dahulu, kemudian buka Hezy dari ikon untuk menghidupkan notifikasi.":
    "On iPhone or iPad, add Hezy to your Home Screen first, then open Hezy from its icon to turn on notifications.",
  "Pilih lokasi dahulu untuk menerima notifikasi.":
    "Choose a location first to receive notifications.",
  "Banner notifikasi": "Notification banners",
  "Bila dihantar": "When to send",
  "Amaran sahaja": "Alerts only",
  "+ Ringkasan 7 pagi": "+ 7 am summary",
  "Kecuali IPU melebihi 300": "Except when API is above 300",
  Mati: "Off",
  NOTIFIKASI: "NOTIFICATIONS",
  "Nombor IPU pada ikon": "API number on icon",
  "Nombor pada ikon": "Number on icon",
  "IPU semasa pada ikon Hezy": "Current API on the Hezy icon",
  "Tentang nombor IPU pada ikon": "About the API number on the icon",
  "iPhone: Hezy dipasang ke Skrin Utama (iOS 16.4 ke atas)":
    "iPhone: Hezy added to the Home Screen (iOS 16.4 or later)",
  "Dikemas kini bila Hezy dibuka atau notifikasi diterima":
    "Updated when Hezy is opened or a notification arrives",
  "Android: kebanyakan telefon menunjukkan titik, bukan nombor":
    "Android: most phones show a dot, not a number",
  "Komputer: Chrome dan Edge (aplikasi dipasang)":
    "Computer: Chrome and Edge (installed app)",
  "Tentang ambang amaran": "About the alert threshold",
  "IPU 50: amaran awal, disyorkan untuk asma, kanak-kanak dan warga emas":
    "API 50: early warning, recommended for asthma, children and older adults",
  "IPU 100: Tidak Sihat": "API 100: Unhealthy",
  "IPU 200: Sangat Tidak Sihat": "API 200: Very Unhealthy",
  "Disemak setiap jam; paling kerap satu amaran setiap 6 jam bagi setiap lokasi":
    "Checked hourly; at most one alert every 6 hours per location",
  "Hidupkan banner notifikasi untuk menerima amaran":
    "Turn on notification banners to receive alerts",
  "Amaran awal": "Early warning",
  "Jerebu dijangka dalam 6 jam atau esok":
    "Haze expected within 6 hours or tomorrow",
  "Lonjakan mendadak": "Sudden spike",
  "Naik 30 atau lebih dalam 3 jam": "Rises 30 or more within 3 hours",
  "Lokasi amaran": "Alert locations",
  "Belum dipilih": "None chosen",
  "Hidupkan waktu senyap": "Turn on quiet hours",
  Hingga: "Until",
  // v0.7.9: Tentang Hezy
  "Semak jerebu di kawasan anda dengan Hezy":
    "Check the haze in your area with Hezy",
  "Tidak dapat berkongsi. Salin pautan: hezy.my":
    "Couldn't share. Copy the link: hezy.my",
  "Maklum balas Hezy {version}": "Hezy feedback {version}",
  Peranti: "Device",
  "Versi {version} · Semak jerebu di Malaysia":
    "Version {version} · Haze checker for Malaysia",
  "Apa yang baharu": "What's new",
  "Kongsi Hezy": "Share Hezy",
  "Hantar maklum balas": "Send feedback",
  Pembangun: "Developer",
  "DIBANGUNKAN OLEH": "MADE BY",
  "© 2026 Hezy · Data rasmi APIMS (JAS)":
    "© 2026 Hezy · Official data from APIMS (DOE)",
  "Tentang Hezy": "About Hezy",
  "Kongsi Hezy dan hantar maklum balas": "Share Hezy and send feedback",
  "Kad pembangun dan senarai Apa yang baharu":
    "Developer card and What's new list",
  "Tetapan lebih kemas": "Tidier Settings",
  "Notifikasi dan amaran diasingkan": "Notifications and alerts separated",
  "Nombor IPU pada ikon aplikasi": "API number on the app icon",
  "Peta lebih besar": "Bigger map",
  "Butang Lapisan dan skrin penuh": "Layers button and full screen",
  "Bar navigasi tidak lagi terangkat di iPhone":
    "Navigation bar no longer lifts on iPhone",
  "Sejarah IPU": "API history",
  "Heatmap memenuhi lebar skrin": "Heatmap fills the screen width",
  "Trend lebih kemas": "Tidier Trend",
  "Ramalan harian dengan kelembapan": "Daily forecast with humidity",
  "Penerangan ringkas dalam ⓘ": "Short explanations in ⓘ",
  // v0.7.10: Tetapan kemas
  "Waktu hantaran": "Delivery",
  "Amaran bila perlu, atau tambah ringkasan pagi":
    "Alerts when needed, or add a morning summary",
  "Lalai untuk profil {profile}": "Default for the {profile} profile",
  "Dipilih sendiri · lalai IPU {threshold}": "Custom · default API {threshold}",
  "Semak amaran sampai ke peranti ini": "Check that alerts reach this device",
  "Semak Jerebu di Malaysia": "Haze checker for Malaysia",
  "Versi {version}": "Version {version}",
  "Dibangunkan oleh": "Made by",
  "Tetapan lebih tersusun": "Better organised Settings",
  "Waktu senyap dan notifikasi ujian kini di bawah Amaran":
    "Quiet hours and test notification now under Alerts",
  "Kad Tentang dan kredit pembangun lebih ringkas":
    "Simpler About card and developer credit",
  "Warna lebih lembut": "Softer colours",
  "Suis dan pilihan kini hijau lembut, berbeza daripada ikon":
    "Switches and selections are now a soft green, distinct from icons",
  // v0.7.12: ikon, privasi, penafian
  "Hezy bukan aplikasi rasmi Jabatan Alam Sekitar (JAS) atau kerajaan. IPU rasmi datang daripada APIMS (JAS).":
    "Hezy is not an official app of the Department of Environment (DOE) or the government. Official API comes from APIMS (DOE).",
  "Data boleh lewat atau tiada. Anggaran dan ramalan mungkin berbeza daripada bacaan sebenar.":
    "Data may be delayed or missing. Estimates and forecasts may differ from actual readings.",
  "Nasihat kesihatan adalah umum, bukan nasihat perubatan. Dapatkan rawatan jika anda bergejala.":
    "Health advice is general, not medical advice. Seek treatment if you have symptoms.",
  "Status sekolah hanya panduan. Keputusan rasmi dibuat oleh sekolah, PPD atau JPN.":
    "School status is guidance only. Official decisions are made by schools, district or state education offices.",
  "Gunakan atas budi bicara sendiri. Hezy tidak bertanggungjawab atas keputusan yang dibuat berdasarkan aplikasi ini.":
    "Use at your own discretion. Hezy is not responsible for decisions made based on this app.",
  "Tiada akaun dan tiada kuki pengiklanan.":
    "No account and no advertising cookies.",
  "Lokasi dan tetapan disimpan dalam peranti anda. Untuk bacaan, koordinat dibundarkan ~1 km dan tidak disimpan.":
    "Location and settings stay on your device. For readings, coordinates are rounded to ~1 km and not stored.",
  "Bila amaran dihidupkan, langganan notifikasi disimpan sehingga anda mematikannya.":
    "When alerts are on, your notification subscription is stored until you turn them off.",
  "Statistik penggunaan tanpa kuki; pengguna individu tidak dikenal pasti.":
    "Cookie-free usage statistics; individual users aren't identified.",
  Penafian: "Disclaimer",
  "Baca dasar privasi penuh": "Read the full privacy policy",
  "Dengan meneruskan, anda bersetuju dengan": "By continuing, you agree to the",
  dan: "and",
  "Ikon baharu dan penafian": "New icon and disclaimer",
  "Ikon awan baharu yang lebih comel": "A new, cuter cloud icon",
  "Privasi dan Penafian di skrin alu-aluan":
    "Privacy and Disclaimer on the welcome screen",
  "NOTIFIKASI DAN AMARAN": "NOTIFICATIONS AND ALERTS",
  "Notifikasi ujian": "Test notification",
  Hantar: "Send",
  "Hantar lagi": "Send again",
  "Notifikasi dan amaran digabung": "Notifications and alerts combined",
  "Tetapan amaran muncul bila banner dihidupkan":
    "Alert settings appear when banners are on",
  "Padam data kini dalam kad Tentang": "Clear data now in the About card",
  "Notifikasi lebih ringkas": "Simpler notifications",
  "Kemas kini kecil": "Small update",
  "Apa yang baharu kini 3 keluaran terkini sahaja":
    "What's new now shows the 3 latest releases only",
  "Butang Padam di sebelah Padam data": "Delete button next to Clear data",
  "+ Ringkasan 7 AM": "+ 7 AM summary",
  "Bacaan {time}": "Reading {time}",
  "Bacaan IPU per jam": "Hourly API readings",
  "Anggaran PM2.5": "PM2.5 estimate",
  "APIMS (JAS)": "APIMS (DOE)",
  Rasmi: "Official",
  "Format masa AM/PM": "AM/PM time format",
  "Kad kongsi IPU lebih kemas": "Tidier API share card",
  "Masa AM/PM yang seragam": "Consistent AM/PM times",
  "Masa AM/PM dan kad kongsi": "AM/PM times and share card",
  "Hezy 0.8: semua paparan dipolish": "Hezy 0.8: every screen polished",
  "Utama, Trend, Lokasi dan Tetapan direka semula":
    "Home, Trend, Locations and Settings redesigned",
  "Ikon baharu, notifikasi lebih ringkas, kad kongsi lebih kemas":
    "New icon, simpler notifications, tidier share card",
  "Keselamatan diperkukuh": "Stronger security",
  "Kemas kini keselamatan penting untuk pelayan Hezy":
    "Important security update for the Hezy server",
  "Perlindungan tambahan untuk notifikasi dan halaman aplikasi":
    "Extra protection for notifications and app pages",
  "Lebih laju dan stabil": "Faster and more stable",
  "Bacaan IPU dimuatkan lebih cepat, terutama lokasi baharu":
    "API readings load faster, especially for new locations",
  "Bacaan tetap dipaparkan walaupun data cuaca lambat atau sumber terganggu":
    "Readings still show when weather data is slow or a source is down",
  "Ramalan harian lebih tepat": "More accurate daily forecast",
  "Ramalan harian kini dikira seperti IPU rasmi JAS (purata 24 jam) dan bermula daripada bacaan rasmi terkini":
    "The daily forecast is now calculated like the official DOE API (24-hour average) and starts from the latest official reading",
  "Anggaran PM2.5 (model CAMS) dibetulkan dengan {n} stesen APIMS berdekatan":
    "PM2.5 estimate (CAMS model) corrected with {n} nearby APIMS stations",
  "Tiada stesen APIMS dalam 30 km · terdekat {station} ({km} km)":
    "No APIMS station within 30 km · nearest {station} ({km} km)",
  "Anggaran dibetulkan · dikemas kini {time}":
    "Corrected estimate · updated {time}",
  "Tiada stesen APIMS dalam 30 km, jadi nombor utama ialah anggaran model CAMS di koordinat anda yang dibetulkan dengan bacaan rasmi stesen berdekatan. Ketepatan berkurang bila stesen lebih jauh.":
    "There is no APIMS station within 30 km, so the main number is the CAMS model estimate at your coordinates, corrected with official readings from nearby stations. Accuracy drops as stations get further away.",
  "Anggaran lebih tepat di kawasan tanpa stesen":
    "More accurate estimates where there is no station",
  "Kawasan jauh dari stesen APIMS kini dibetulkan dengan bacaan rasmi stesen berdekatan":
    "Areas far from APIMS stations are now corrected with official readings from nearby stations",
  "Bacaan rasmi terbaharu muncul lebih cepat selepas JAS menerbitkannya":
    "The latest official reading appears sooner after the DOE publishes it",
  "Amaran dan ramalan rasmi MetMalaysia":
    "Official MetMalaysia warnings and forecast",
  "Amaran ribut petir dan hujan lebat MetMalaysia untuk negeri anda di Utama":
    "MetMalaysia thunderstorm and heavy rain warnings for your state on Home",
  "Ramalan cuaca rasmi negeri di Trend; sensor peta kini melalui pelayan Hezy":
    "Official state weather forecast in Trend; map sensors now go through the Hezy server",
  "Sehingga {time}": "Until {time}",
  "Cuaca rasmi": "Official weather",
  "Amaran cuaca MetMalaysia": "MetMalaysia weather warning",
  "Sumber: MetMalaysia melalui data.gov.my":
    "Source: MetMalaysia via data.gov.my",
  "Ramalan rasmi MetMalaysia": "Official MetMalaysia forecast",
  "Negeri {state} · sumber data.gov.my": "{state} · source data.gov.my",
  // Frasa ramalan MetMalaysia (api.data.gov.my, teks BM tetap).
  "Tiada Hujan": "No rain",
  Jerebu: "Haze",
  "Ribut petir menyeluruh": "Widespread thunderstorms",
  "Hujan menyeluruh": "Widespread rain",
  "Ribut petir di beberapa tempat": "Thunderstorms in some places",
  "Ribut petir di kebanyakan tempat": "Thunderstorms in most places",
  "Ribut petir di satu dua tempat": "Isolated thunderstorms",
  "Hujan di beberapa tempat": "Rain in some places",
  "Hujan di kebanyakan tempat": "Rain in most places",
  "Hujan di satu dua tempat": "Isolated rain",
  "Ribut petir di beberapa tempat di kawasan pantai":
    "Thunderstorms in some coastal areas",
  "Ribut petir di beberapa tempat di kawasan pedalaman":
    "Thunderstorms in some inland areas",
  "Ribut petir di kebanyakan tempat di kawasan pantai":
    "Thunderstorms in most coastal areas",
  "Ribut petir di kebanyakan tempat di kawasan pedalaman":
    "Thunderstorms in most inland areas",
  "Hujan di beberapa tempat di kawasan pantai": "Rain in some coastal areas",
  "Hujan di beberapa tempat di kawasan pedalaman": "Rain in some inland areas",
  "Sepanjang Hari": "All day",
  "Pagi dan Petang": "Morning and afternoon",
  "Petang dan Malam": "Afternoon and night",
  "Pagi dan Malam": "Morning and night",
  "Amaran lebih tepat pada masanya": "More timely alerts",
  "Semakan amaran IPU dijalankan lebih kerap supaya notifikasi tidak lewat":
    "API alert checks run more often so notifications are not late",
  "Ringkasan pagi, status sekolah dan ramalan esok mempunyai jadual sandaran":
    "The morning summary, school status and tomorrow's forecast now have a backup schedule",
  "Model ramalan baharu diuji di latar belakang sebelum digunakan sepenuhnya":
    "A new forecast model is being tested in the background before full use",
};

/** Corak untuk teks yang disimpan dengan nama tempat, cth. nama lokasi GPS. */
const EN_PATTERNS: [RegExp, string][] = [[/^Berhampiran (.+)$/, "Near $1"]];

function toEnglish(text: string): string {
  if (text in EN) return EN[text];
  for (const [pattern, replacement] of EN_PATTERNS) {
    if (pattern.test(text)) return text.replace(pattern, replacement);
  }
  return text;
}

/** Terjemah teks BM ke bahasa pilihan dan isi pembolehubah {nama}. */
export function translate(
  lang: Lang,
  text: string,
  vars?: Record<string, string | number>,
): string {
  const template = lang === "en" ? toEnglish(text) : text;
  return vars
    ? template.replace(/\{(\w+)\}/g, (m, k: string) =>
        k in vars ? String(vars[k]) : m,
      )
    : template;
}
