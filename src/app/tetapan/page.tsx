import type { Metadata } from "next";
import { TetapanScreen } from "@/components/screens/tetapan-screen";

export const metadata: Metadata = { title: "Tetapan" };

export default function TetapanPage() {
  return <TetapanScreen />;
}
