/** Logo Hezy: awan comel bermata. Sama seperti ikon PWA (scripts/generate-icons.mjs). */
export function Logo({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
    >
      <rect width="512" height="512" rx="120" fill="#bfe0f5" />
      <g fill="#fff">
        <circle cx="175" cy="290" r="85" />
        <circle cx="262" cy="225" r="112" />
        <circle cx="350" cy="292" r="82" />
        <ellipse cx="262" cy="332" rx="172" ry="62" />
      </g>
      <ellipse cx="228" cy="295" rx="15" ry="20" fill="#1e2430" />
      <ellipse cx="298" cy="295" rx="15" ry="20" fill="#1e2430" />
      <circle cx="233" cy="287" r="5" fill="#fff" />
      <circle cx="303" cy="287" r="5" fill="#fff" />
      <circle cx="196" cy="324" r="15" fill="#f7b5b5" />
      <circle cx="330" cy="324" r="15" fill="#f7b5b5" />
      <path
        d="M247 322 Q263 338 279 322"
        fill="none"
        stroke="#1e2430"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
}
