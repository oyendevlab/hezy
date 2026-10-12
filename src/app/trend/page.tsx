import type { Metadata } from "next";
import { TrendScreen } from "@/components/screens/trend-screen";
import { PageTransition } from "@/components/page-transition";

export const metadata: Metadata = { title: "Trend" };

export default function TrendPage() {
  return (
    <PageTransition>
      <TrendScreen />
    </PageTransition>
  );
}
