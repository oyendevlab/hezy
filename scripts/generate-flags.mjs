// Jana bendera negeri (PNG 96×48, 3× untuk paparan 32×16) daripada SVG Wikimedia Commons.
// Guna: node scripts/generate-flags.mjs <folder-svg>  (fail <id-negeri>.svg + credits.json)
// SVG sumber tidak disimpan dalam repo; lesen dan atribusi: public/flags/CREDITS.md.
import sharp from "sharp";
import { format } from "prettier";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";

const source = process.argv[2];
if (!source)
  throw new Error("Guna: node scripts/generate-flags.mjs <folder-svg>");
await mkdir("public/flags", { recursive: true });

for (const file of (await readdir(source)).filter((f) => f.endsWith(".svg"))) {
  const id = file.slice(0, -4);
  const out = `public/flags/${id}.png`;
  await sharp(`${source}/${file}`, { density: 96 })
    .resize(96, 48, { fit: "fill" })
    .png({ palette: true, quality: 90, compressionLevel: 9 })
    .toFile(out);
  console.log(`✓ ${out}`);
}

const credits = JSON.parse(await readFile(`${source}/credits.json`, "utf8"));
const lines = [
  "# Bendera negeri: sumber dan lesen",
  "",
  "Bendera dijana semula (PNG 96×48) daripada fail SVG di Wikimedia Commons oleh `scripts/generate-flags.mjs`.",
  "Bendera ialah lambang rasmi negeri; Hezy menggunakannya untuk mengenal pasti negeri sahaja dan tidak berkaitan dengan mana-mana kerajaan negeri.",
  "Fail berlesen CC BY-SA kekal di bawah lesen yang sama.",
  "",
  "| Negeri | Fail sumber | Lesen | Pelukis |",
  "| --- | --- | --- | --- |",
  ...credits.map(
    (c) =>
      `| ${c.id} | [${c.file}](${c.page}) | ${c.licenseUrl ? `[${c.license}](${c.licenseUrl})` : c.license} | ${c.artist.replace(/\|/g, "/").replace(/\s+/g, " ").slice(0, 120)} |`,
  ),
  "",
];
await writeFile(
  "public/flags/CREDITS.md",
  await format(lines.join("\n"), { parser: "markdown" }),
);
console.log("✓ public/flags/CREDITS.md");
