import type { Metadata } from "next";
import { LokasiScreen } from "@/components/screens/lokasi-screen";
import { PageTransition } from "@/components/page-transition";

export const metadata: Metadata = { title: "Lokasi" };

export default function LokasiPage() {
  return (
    <PageTransition>
      <LokasiScreen />
    </PageTransition>
  );
}
