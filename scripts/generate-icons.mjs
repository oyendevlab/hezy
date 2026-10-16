// Jana ikon PWA Hezy (awan comel) daripada SVG. Jalankan: npm run icons
// Reka bentuk yang sama digunakan oleh src/components/logo.tsx.
import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";

const SKY = "#a3d8f7";

/**
 * Ikon v0.7.12: kepul awan putih besar mengisi bahagian bawah, langit biru cerah, mata bujur
 * memandang ke depan dan senyum kecil. Seni penuh 512×512 (OS memotong bucu); mata dan senyum
 * dalam bulatan selamat r=205 untuk ikon maskable. Sama seperti src/components/logo.tsx.
 */
const art = `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#c2e8fd"/><stop offset="1" stop-color="#78c3ef"/>
    </linearGradient>
    <linearGradient id="cloud" x1="120" y1="90" x2="400" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.55" stop-color="#f3f7fa"/><stop offset="1" stop-color="#d3e0ea"/>
    </linearGradient>
    <radialGradient id="gloss" cx="200" cy="170" r="190" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#sky)"/>
  <g fill="#5aa9d8" opacity="0.25">
    <circle cx="110" cy="345" r="140"/><circle cx="256" cy="260" r="168"/><circle cx="402" cy="345" r="140"/>
  </g>
  <g fill="url(#cloud)">
    <circle cx="110" cy="335" r="140"/><circle cx="256" cy="250" r="168"/><circle cx="402" cy="335" r="140"/>
    <rect x="-30" y="335" width="572" height="200"/>
  </g>
  <ellipse cx="215" cy="175" rx="120" ry="70" fill="url(#gloss)"/>
  <rect x="196" y="230" width="38" height="80" rx="19" fill="#1e2430"/>
  <rect x="278" y="230" width="38" height="80" rx="19" fill="#1e2430"/>
  <rect x="205" y="240" width="12" height="20" rx="6" fill="#fff" opacity="0.85"/>
  <rect x="287" y="240" width="12" height="20" rx="6" fill="#fff" opacity="0.85"/>
  <path d="M232 340 Q256 360 280 340" fill="none" stroke="#1e2430" stroke-width="12" stroke-linecap="round"/>
`;

/** `scale` < 1 mengecilkan muka ke tengah (zon selamat); langit dan awan tetap penuh. */
function svg(scale = 1) {
  const offset = (512 * (1 - scale)) / 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <rect width="512" height="512" fill="${SKY}"/>
      <g transform="translate(${offset} ${offset}) scale(${scale})">${art}</g>
    </svg>`,
  );
}

const outputs = [
  { file: "public/icons/icon-192.png", size: 192, scale: 1 },
  { file: "public/icons/icon-512.png", size: 512, scale: 1 },
  { file: "public/icons/maskable-512.png", size: 512, scale: 1 },
  { file: "public/icons/apple-touch-icon.png", size: 180, scale: 1 },
  { file: "src/app/icon.png", size: 64, scale: 1 },
];

/** Ikon pintasan Android (96×96): simbol gelap di atas latar langit. */
const SHORTCUT_GLYPHS = {
  trend:
    '<polyline points="6 30 18 18 26 26 42 10" /><polyline points="32 10 42 10 42 20" />',
  peta: '<path d="M24 42s-12-10.5-12-20a12 12 0 0 1 24 0c0 9.5-12 20-12 20z" /><circle cx="24" cy="22" r="4.5" />',
  tetapan: `<line x1="8" y1="14" x2="40" y2="14" /><line x1="8" y1="24" x2="40" y2="24" /><line x1="8" y1="34" x2="40" y2="34" /><circle cx="30" cy="14" r="4" fill="${SKY}" /><circle cx="17" cy="24" r="4" fill="${SKY}" /><circle cx="27" cy="34" r="4" fill="${SKY}" />`,
};

await mkdir("public/icons", { recursive: true });
for (const [name, glyph] of Object.entries(SHORTCUT_GLYPHS)) {
  const file = `public/icons/shortcut-${name}.png`;
  const shortcut = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <rect width="48" height="48" rx="12" fill="${SKY}"/>
      <g fill="none" stroke="#1e2430" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${glyph}</g>
    </svg>`,
  );
  await sharp(shortcut).resize(96, 96).png().toFile(file);
  console.log(`✓ ${file} (96×96)`);
}
for (const { file, size, scale } of outputs) {
  await sharp(svg(scale)).resize(size, size).png().toFile(file);
  console.log(`✓ ${file} (${size}×${size})`);
}

// Skrin pembuka iOS (apple-touch-startup-image): awan di tengah atas latar langit/gelap.
const SPLASH_THEME = {
  light: { top: "#cfe8f8", bottom: "#f4f9fc" },
  dark: { top: "#1b2230", bottom: "#121316" },
};
const screens = JSON.parse(
  await readFile("src/lib/splash-screens.json", "utf8"),
);
await mkdir("public/splash", { recursive: true });
for (const { w, h, dpr } of screens) {
  const [pw, ph] = [w * dpr, h * dpr];
  // Ikon ~30% lebar skrin terkecil, sedikit di atas tengah.
  const size = Math.round(Math.min(pw, ph) * 0.3);
  const x = (pw - size) / 2;
  const y = ph * 0.45 - size / 2;
  for (const [theme, { top, bottom }] of Object.entries(SPLASH_THEME)) {
    const file = `public/splash/splash-${pw}x${ph}-${theme}.png`;
    const image = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}" viewBox="0 0 ${pw} ${ph}">
        <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/>
        </linearGradient></defs>
        <rect width="${pw}" height="${ph}" fill="url(#g)"/>
        <defs><clipPath id="tile"><rect width="512" height="512" rx="115"/></clipPath></defs>
        <g transform="translate(${x} ${y}) scale(${size / 512})"><g clip-path="url(#tile)">${art}</g></g>
      </svg>`,
    );
    await sharp(image).png({ palette: true, quality: 90 }).toFile(file);
  }
  console.log(`✓ public/splash/splash-${pw}x${ph}-{light,dark}.png`);
}
