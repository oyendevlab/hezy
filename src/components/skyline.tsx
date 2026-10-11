import type { SkyPalette } from "@/lib/category-style";

type Props = {
  palette: SkyPalette;
  variant: "phone" | "panorama";
  className?: string;
};

/** Ilustrasi kaki langit bandar (mockup C). Warna dan kabus berubah ikut kategori IPU. */
export function Skyline({ palette: p, variant, className }: Props) {
  return variant === "phone" ? (
    <PhoneSkyline p={p} className={className} />
  ) : (
    <PanoramaSkyline p={p} className={className} />
  );
}

function PhoneSkyline({ p, className }: { p: SkyPalette; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 390 440"
      preserveAspectRatio="xMidYMax slice"
      className={className}
    >
      <rect width="390" height="440" fill={p.sky} />
      <circle cx="296" cy="118" r="40" fill={p.sun} opacity={p.sunOpacity} />
      <g fill={p.far}>
        <rect x="0" y="262" width="42" height="178" />
        <rect x="38" y="230" width="30" height="210" />
        <rect x="66" y="276" width="50" height="164" />
        <rect x="112" y="214" width="28" height="226" />
        <rect x="236" y="226" width="36" height="214" />
        <rect x="268" y="254" width="44" height="186" />
        <rect x="308" y="208" width="30" height="232" />
        <rect x="336" y="248" width="54" height="192" />
      </g>
      <rect width="390" height="440" fill="#fff" opacity={p.haze} />
      <g fill={p.near}>
        <rect x="150" y="150" width="26" height="290" />
        <polygon points="150,150 163,104 176,150" />
        <rect x="161" y="78" width="4" height="30" />
        <rect x="196" y="150" width="26" height="290" />
        <polygon points="196,150 209,104 222,150" />
        <rect x="207" y="78" width="4" height="30" />
        <rect x="176" y="236" width="20" height="7" />
        <rect x="0" y="334" width="60" height="106" />
        <rect x="56" y="304" width="44" height="136" />
        <rect x="96" y="352" width="44" height="88" />
        <rect x="232" y="296" width="50" height="144" />
        <rect x="278" y="338" width="36" height="102" />
        <rect x="310" y="276" width="46" height="164" />
        <rect x="352" y="326" width="38" height="114" />
        <circle cx="128" cy="404" r="22" />
        <circle cx="262" cy="410" r="20" />
        <rect x="0" y="414" width="390" height="26" />
      </g>
      <rect width="390" height="440" fill="#fff" opacity={p.hazeTop} />
    </svg>
  );
}

const FAR = [
  [0, 170, 60],
  [55, 140, 40],
  [90, 185, 70],
  [155, 125, 36],
  [186, 160, 60],
  [240, 190, 50],
  [285, 150, 40],
  [700, 140, 46],
  [742, 175, 60],
  [798, 120, 38],
  [832, 165, 70],
  [898, 190, 50],
  [944, 145, 44],
  [984, 175, 64],
  [1044, 130, 40],
  [1080, 165, 70],
  [1146, 185, 54],
] as const;

const NEAR = [
  [0, 220, 80],
  [76, 200, 50],
  [122, 235, 60],
  [178, 210, 56],
  [230, 240, 70],
  [296, 195, 48],
  [340, 225, 80],
  [416, 205, 52],
  [464, 230, 70],
  [660, 215, 60],
  [716, 190, 50],
  [762, 230, 74],
  [832, 205, 52],
  [880, 235, 70],
  [946, 200, 46],
  [988, 225, 80],
  [1064, 205, 54],
  [1114, 230, 86],
] as const;

function PanoramaSkyline({
  p,
  className,
}: {
  p: SkyPalette;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 300"
      preserveAspectRatio="xMidYMax slice"
      className={className}
    >
      <rect width="1200" height="300" fill={p.sky} />
      <circle cx="980" cy="80" r="40" fill={p.sun} opacity={p.sunOpacity} />
      <g fill={p.far}>
        {FAR.map(([x, y, w]) => (
          <rect key={x} x={x} y={y} width={w} height={300 - y} />
        ))}
      </g>
      <rect width="1200" height="300" fill="#fff" opacity={p.haze} />
      <g fill={p.near}>
        <rect x="560" y="60" width="34" height="240" />
        <polygon points="560,60 577,24 594,60" />
        <rect x="575" y="4" width="4" height="24" />
        <rect x="610" y="60" width="34" height="240" />
        <polygon points="610,60 627,24 644,60" />
        <rect x="625" y="4" width="4" height="24" />
        <rect x="594" y="150" width="16" height="6" />
        {NEAR.map(([x, y, w]) => (
          <rect key={x} x={x} y={y} width={w} height={300 - y} />
        ))}
        <circle cx="450" cy="280" r="18" />
        <circle cx="690" cy="282" r="16" />
        <circle cx="905" cy="280" r="18" />
        <rect x="0" y="285" width="1200" height="15" />
      </g>
      <rect width="1200" height="300" fill="#fff" opacity={p.hazeTop} />
    </svg>
  );
}
