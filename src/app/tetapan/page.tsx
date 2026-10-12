import type { Metadata } from "next";
import { TetapanScreen } from "@/components/screens/tetapan-screen";
import { PageTransition } from "@/components/page-transition";

export const metadata: Metadata = { title: "Tetapan" };

export default function TetapanPage() {
  return (
    <PageTransition>
      <TetapanScreen />
    </PageTransition>
  );
}
