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
  "Elak bersenam di luar hari ini.": "Avoid exercising outdoors today.",
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
  "Pilih lokasi untuk melihat Indeks Pencemar Udara (IPU) dan nasihat kesihatan.":
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
  "IPU {ipu}, {label}": "API {ipu}, {label}",
  "Data mungkin tidak terkini.": "Data may be out of date.",
  "{error} Memaparkan bacaan {time}.":
    "{error} Showing the reading from {time}.",
  "{error} Memaparkan bacaan terakhir.": "{error} Showing the last reading.",

  // Status sekolah
  "STATUS SEKOLAH": "SCHOOL STATUS",
  "Sekolah mungkin ditutup": "Schools may be closed",
  "Garis panduan KPM: sekolah di kawasan atau daerah dengan IPU melebihi 200 ditutup segera. Semak makluman rasmi sekolah dan PPD tentang PdPR.":
    "MOE guideline: schools in areas or districts with an API above 200 close immediately. Check official notices from the school and district office about home-based learning.",
  "Aktiviti luar dihentikan": "Outdoor activities stopped",
  "Garis panduan KPM: semua aktiviti luar bilik darjah, termasuk perhimpunan, sukan dan kokurikulum, dihentikan bila IPU melebihi 100. Sekolah kekal dibuka.":
    "MOE guideline: all outdoor activities, including assemblies, sports and co-curricular activities, stop when the API is above 100. Schools stay open.",
  "Sekolah seperti biasa": "School as usual",
  "Aktiviti luar dibenarkan. KPM menyarankan aktiviti luar ditangguhkan jika cuaca terlalu panas dan berjerebu; pantau murid yang ada asma.":
    "Outdoor activities allowed. The MOE advises postponing outdoor activities in very hot and hazy weather; watch pupils with asthma.",
  "Panduan sahaja (IPU rasmi {ipu}). Keputusan rasmi dibuat oleh sekolah, PPD dan JPN.":
    "Guidance only (official API {ipu}). Official decisions are made by schools and education offices.",
  "Panduan sahaja (anggaran IPU {ipu}). Keputusan rasmi dibuat oleh sekolah, PPD dan JPN.":
    "Guidance only (estimated API {ipu}). Official decisions are made by schools and education offices.",

  // Trend
  "MASA TERBAIK UNTUK KELUAR": "BEST TIME TO GO OUT",
  "Anggaran IPU ~{ipu} · {label}": "Estimated API ~{ipu} · {label}",
  "Hari ini, jam demi jam": "Today, hour by hour",
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
  "Sejarah 12 minggu": "12-week history",
  "IPU maks harian · Stesen {station}": "Daily max API · {station} station",
  Isn: "Mon",
  Rab: "Wed",
  Jum: "Fri",
  "Heatmap IPU harian, 12 minggu": "Daily API heatmap, 12 weeks",
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
  "Sentiasa dipaparkan untuk profil Kanak-kanak":
    "Always shown for the Children profile",
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
