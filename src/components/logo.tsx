import { useId } from "react";

/**
 * Logo Hezy (v0.7.12): kepul awan putih besar di atas langit biru cerah, mata bujur memandang
 * ke depan dan senyum kecil. Sama seperti ikon PWA (scripts/generate-icons.mjs).
 */
export function Logo({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  // Id unik: beberapa logo dalam satu halaman tidak berkongsi kecerunan (tersembunyi = rosak).
  const id = useId().replace(/:/g, "");
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
    >
      <defs>
        <clipPath id={`${id}t`}>
          <rect width="512" height="512" rx="115" />
        </clipPath>
        <linearGradient
          id={`${id}s`}
          x1="0"
          y1="0"
          x2="0"
          y2="512"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#c2e8fd" />
          <stop offset="1" stopColor="#78c3ef" />
        </linearGradient>
        <linearGradient
          id={`${id}c`}
          x1="120"
          y1="90"
          x2="400"
          y2="512"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#f3f7fa" />
          <stop offset="1" stopColor="#d3e0ea" />
        </linearGradient>
        <radialGradient
          id={`${id}g`}
          cx="200"
          cy="170"
          r="190"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${id}t)`}>
        <rect width="512" height="512" fill={`url(#${id}s)`} />
        <g fill="#5aa9d8" opacity="0.25">
          <circle cx="110" cy="345" r="140" />
          <circle cx="256" cy="260" r="168" />
          <circle cx="402" cy="345" r="140" />
        </g>
        <g fill={`url(#${id}c)`}>
          <circle cx="110" cy="335" r="140" />
          <circle cx="256" cy="250" r="168" />
          <circle cx="402" cy="335" r="140" />
          <rect x="-30" y="335" width="572" height="200" />
        </g>
        <ellipse cx="215" cy="175" rx="120" ry="70" fill={`url(#${id}g)`} />
        <rect x="196" y="230" width="38" height="80" rx="19" fill="#1e2430" />
        <rect x="278" y="230" width="38" height="80" rx="19" fill="#1e2430" />
        <rect
          x="205"
          y="240"
          width="12"
          height="20"
          rx="6"
          fill="#fff"
          opacity="0.85"
        />
        <rect
          x="287"
          y="240"
          width="12"
          height="20"
          rx="6"
          fill="#fff"
          opacity="0.85"
        />
        <path
          d="M232 340 Q256 360 280 340"
          fill="none"
          stroke="#1e2430"
          strokeWidth="12"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
