"use client";

import { useI18n } from "@/lib/use-i18n";

/**
 * Teks terjemah untuk halaman yang dijana di pelayan (/negeri, /kongsi): BM semasa render
 * pelayan, kemudian bahasa pengguna selepas hidrasi.
 */
export function T({
  children,
  vars,
}: {
  children: string;
  vars?: Record<string, string | number>;
}) {
  const { t } = useI18n();
  return <>{t(children, vars)}</>;
}
