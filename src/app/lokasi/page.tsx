import type { Metadata } from "next";
import { LokasiScreen } from "@/components/screens/lokasi-screen";

export const metadata: Metadata = { title: "Lokasi" };

export default function LokasiPage() {
  return <LokasiScreen />;
}
