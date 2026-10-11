// Jana ikon PWA Hezy (awan comel) daripada SVG. Jalankan: npm run icons
// Reka bentuk yang sama digunakan oleh src/components/logo.tsx.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SKY = "#bfe0f5";

/** Awan bermata dalam kotak 512×512. Semua bentuk berada dalam bulatan selamat r=205. */
const cloud = `
  <ellipse cx="262" cy="412" rx="120" ry="14" fill="#000" opacity="0.08"/>
  <g fill="#fff">
    <circle cx="175" cy="290" r="85"/>
    <circle cx="262" cy="225" r="112"/>
    <circle cx="350" cy="292" r="82"/>
    <ellipse cx="262" cy="332" rx="172" ry="62"/>
  </g>
  <ellipse cx="228" cy="295" rx="15" ry="20" fill="#1e2430"/>
  <ellipse cx="298" cy="295" rx="15" ry="20" fill="#1e2430"/>
  <circle cx="233" cy="287" r="5" fill="#fff"/>
  <circle cx="303" cy="287" r="5" fill="#fff"/>
  <circle cx="196" cy="324" r="15" fill="#f7b5b5"/>
  <circle cx="330" cy="324" r="15" fill="#f7b5b5"/>
  <path d="M247 322 Q263 338 279 322" fill="none" stroke="#1e2430" stroke-width="8" stroke-linecap="round"/>
`;

/** `scale` < 1 mengecilkan awan ke tengah (zon selamat ikon maskable). */
function svg(scale = 1) {
  const offset = (512 * (1 - scale)) / 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <rect width="512" height="512" fill="${SKY}"/>
      <g transform="translate(${offset} ${offset}) scale(${scale})">${cloud}</g>
    </svg>`,
  );
}

const outputs = [
  { file: "public/icons/icon-192.png", size: 192, scale: 1 },
  { file: "public/icons/icon-512.png", size: 512, scale: 1 },
  { file: "public/icons/maskable-512.png", size: 512, scale: 0.86 },
  { file: "public/icons/apple-touch-icon.png", size: 180, scale: 0.92 },
  { file: "src/app/icon.png", size: 64, scale: 1 },
];

await mkdir("public/icons", { recursive: true });
for (const { file, size, scale } of outputs) {
  await sharp(svg(scale)).resize(size, size).png().toFile(file);
  console.log(`✓ ${file} (${size}×${size})`);
}
