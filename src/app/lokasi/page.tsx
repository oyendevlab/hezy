import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Lokasi" };

export default function LokasiPage() {
  return (
    <ComingSoon title="Lokasi">
      Lokasi semasa, senarai kegemaran dan togol Senarai | Peta akan dibina
      dalam Fasa 3.
    </ComingSoon>
  );
}
