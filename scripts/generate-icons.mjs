// Jana ikon PWA Hezy daripada SVG. Jalankan: npm run icons
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SKY = "#e7d4a4";
/** Warna langit selepas lapisan kabus putih 30%; digunakan di luar zon selamat. */
const SKY_HAZED = "#eee1bf";
const GROUND = "#4a4335";

/** Ilustrasi menara dalam jerebu (gaya mockup C), dalam kotak 512×512. */
const artwork = `
  <rect width="512" height="512" fill="${SKY}"/>
  <circle cx="360" cy="160" r="56" fill="#f6c453"/>
  <g fill="#c3b18b">
    <rect x="40" y="300" width="70" height="212"/><rect x="100" y="260" width="50" height="252"/>
    <rect x="150" y="320" width="60" height="192"/><rect x="330" y="280" width="60" height="232"/>
    <rect x="380" y="240" width="50" height="272"/><rect x="420" y="300" width="92" height="212"/>
  </g>
  <rect width="512" height="512" fill="#fff" opacity="0.3"/>
  <g fill="${GROUND}">
    <rect x="200" y="150" width="44" height="362"/><polygon points="200,150 222,95 244,150"/><rect x="220" y="58" width="4" height="40"/>
    <rect x="268" y="150" width="44" height="362"/><polygon points="268,150 290,95 312,150"/><rect x="288" y="58" width="4" height="40"/>
    <rect x="244" y="290" width="24" height="10"/>
    <rect x="0" y="400" width="120" height="112"/><rect x="120" y="430" width="70" height="82"/>
    <rect x="330" y="410" width="80" height="102"/><rect x="410" y="380" width="102" height="132"/>
  </g>
`;

/** `scale` < 1 mengecilkan ilustrasi ke tengah (zon selamat ikon maskable). */
function svg(scale = 1) {
  const offset = (512 * (1 - scale)) / 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <rect width="512" height="512" fill="${SKY_HAZED}"/>
      <rect y="${offset + 512 * scale - 1}" width="512" height="${offset + 1}" fill="${GROUND}"/>
      <g transform="translate(${offset} ${offset}) scale(${scale})">
        <svg viewBox="0 0 512 512" width="512" height="512" overflow="hidden">${artwork}</svg>
      </g>
    </svg>`,
  );
}

const outputs = [
  { file: "public/icons/icon-192.png", size: 192, scale: 1 },
  { file: "public/icons/icon-512.png", size: 512, scale: 1 },
  { file: "public/icons/maskable-512.png", size: 512, scale: 0.78 },
  { file: "public/icons/apple-touch-icon.png", size: 180, scale: 0.9 },
  { file: "src/app/icon.png", size: 64, scale: 1 },
];

await mkdir("public/icons", { recursive: true });
for (const { file, size, scale } of outputs) {
  await sharp(svg(scale)).resize(size, size).png().toFile(file);
  console.log(`✓ ${file} (${size}×${size})`);
}
