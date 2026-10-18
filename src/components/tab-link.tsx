"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

/**
 * Pautan ke tab utama tanpa prefetch automatik (v0.8.14): dahulu setiap paparan halaman memuat
 * semua tab lain sebaik pautan kelihatan, walaupun tidak dibuka (~9,000 permintaan CDN sehari).
 * Prefetch bermula bila pautan disentuh, dihover atau difokus, jadi navigasi masih cepat.
 */
export function TabLink({
  href,
  ...props
}: Omit<ComponentProps<typeof Link>, "href" | "prefetch"> & { href: string }) {
  const router = useRouter();
  const warm = () => router.prefetch(href);
  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      onPointerEnter={warm}
      onTouchStart={warm}
      onFocus={warm}
    />
  );
}
