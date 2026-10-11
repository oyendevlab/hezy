import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Tetapan" };

export default function TetapanPage() {
  return (
    <ComingSoon title="Tetapan">
      Profil kesihatan, tema dan bahasa akan dibina dalam Fasa 3.
    </ComingSoon>
  );
}
