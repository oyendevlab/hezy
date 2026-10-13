"use client";

import { buildStateCardPath } from "@/lib/state-card";
import { useI18n } from "@/lib/use-i18n";
import { ShareButton } from "./share-button";

/** Butang "Gambar" di halaman negeri: kad imej negeri (segi empat / Status) untuk dikongsi. */
export function StateShareButton({
  stateId,
  stateName,
}: {
  stateId: string;
  stateName: string;
}) {
  const { t, lang } = useI18n();
  return (
    <ShareButton
      text={t("IPU {state} hari ini · via Hezy", { state: stateName })}
      path={`/negeri/${stateId}`}
      card={(format) => buildStateCardPath(stateId, lang, format)}
      fileName={`hezy-${stateId}`}
      label={t("Gambar")}
      title={t("Kongsi gambar {state}", { state: stateName })}
      className="border-line bg-surface shrink-0 border"
    />
  );
}
